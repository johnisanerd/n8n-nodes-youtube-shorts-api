import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { apiRequest, getResults, isUsedAsAiTool, pollRunStatus } from './genericFunctions';
import { ACTOR_ID } from '../ApifyYoutubeShorts.node';
import { buildActorInput } from '../ApifyYoutubeShorts.properties';

export async function getDefaultBuild(this: IExecuteFunctions, actorId: string) {
	const defaultBuildResp = await apiRequest.call(this, {
		method: 'GET',
		uri: `/v2/acts/${actorId}/builds/default`,
	});
	if (!defaultBuildResp?.data) {
		throw new NodeApiError(this.getNode(), {
			message: `Could not fetch default build for Actor ${actorId}`,
		});
	}
	return defaultBuildResp.data;
}

export function getDefaultInputsFromBuild(build: any) {
	const buildInputProperties = build?.actorDefinition?.input?.properties;
	const defaultInput: Record<string, any> = {};
	if (buildInputProperties && typeof buildInputProperties === 'object') {
		for (const [key, property] of Object.entries(buildInputProperties)) {
			if (
				property &&
				typeof property === 'object' &&
				'prefill' in property &&
				(property as any).prefill !== undefined &&
				(property as any).prefill !== null
			) {
				defaultInput[key] = (property as any).prefill;
			}
		}
	}
	return defaultInput;
}

export async function runActorApi(
	this: IExecuteFunctions,
	actorId: string,
	mergedInput: Record<string, any>,
	qs: Record<string, any>,
) {
	return await apiRequest.call(this, {
		method: 'POST',
		uri: `/v2/acts/${actorId}/runs`,
		body: mergedInput,
		qs,
	});
}

/**
 * Shape a single row according to the chosen Output mode.
 * Each dataset row is one Short (flat), or a small error row ({url, input, error, note})
 * for a channel or link that could not be read.
 * - simplified: a small, LLM-friendly object (also forced when used as an AI tool)
 * - selected: only the picked fields, using the Actor's own keys
 * - raw: the item untouched
 */
function shapeItem(
	item: Record<string, any>,
	mode: string,
	fields: string[],
): Record<string, any> {
	if (mode === 'raw') {
		return item;
	}
	if (mode === 'selected') {
		const picked: Record<string, any> = {};
		for (const field of fields) {
			if (field in item) {
				picked[field] = item[field];
			}
		}
		return picked;
	}
	// simplified; rows that are neither a Short nor an error row (for example a
	// free-plan allowance notice) pass through unchanged so nothing is hidden
	if (!item.id && !item.error) {
		return item;
	}
	const simplified: Record<string, any> = {
		id: item.id,
		url: item.url,
		title: item.title,
		date: item.date,
		duration: item.duration,
		viewCount: item.viewCount,
		likes: item.likes,
		commentsCount: item.commentsCount,
		commentsTurnedOff: item.commentsTurnedOff || undefined,
		hashtags: item.hashtags,
		tags: item.tags,
		channelName: item.channelName,
		channelUsername: item.channelUsername,
		numberOfSubscribers: item.numberOfSubscribers,
		// error rows
		input: item.error ? item.input : undefined,
		error: item.error,
		note: item.note,
	};
	for (const key of Object.keys(simplified)) {
		if (simplified[key] === undefined || simplified[key] === null) {
			delete simplified[key];
		}
	}
	return simplified;
}

export async function runActor(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const build = await getDefaultBuild.call(this, ACTOR_ID);
	const defaultInput = getDefaultInputsFromBuild(build);
	const mergedInput = buildActorInput(this, i, defaultInput);

	const run = await runActorApi.call(this, ACTOR_ID, mergedInput, { waitForFinish: 0 });
	if (!run?.data?.id) {
		throw new NodeApiError(this.getNode(), {
			message: 'Run ID not found after starting the Actor',
		});
	}

	const runId = run.data.id;
	const datasetId = run.data.defaultDatasetId;
	await pollRunStatus.call(this, runId);
	const items = await getResults.call(this, datasetId);

	let mode = this.getNodeParameter('output', i, 'simplified') as string;
	if (isUsedAsAiTool(this.getNode().type)) {
		mode = 'simplified';
	}
	const fields = (this.getNodeParameter('fields', i, []) as string[]) ?? [];

	const shaped = items.map((item) => shapeItem(item, mode, fields));
	return this.helpers.returnJsonArray(shaped);
}
