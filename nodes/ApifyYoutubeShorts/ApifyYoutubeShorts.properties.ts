import { IExecuteFunctions, INodeProperties, NodeOperationError } from 'n8n-workflow';

/**
 * Build the Apify Actor input from node parameters.
 * Only the real Actor inputs are sent; the Output / Fields parameters shape the
 * data we return, they are not part of the Actor input.
 *
 * Channels and Short links are always sent explicitly (empty lists included) so
 * the Actor's prefilled example channel never leaks into a run that only asked
 * for specific links.
 */
export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	const input: Record<string, any> = { ...defaultInput };

	const channels = ((context.getNodeParameter('channels', itemIndex, []) as string[]) ?? [])
		.map((c) => (c ?? '').trim())
		.filter((c) => c.length > 0);
	const shortLinks = ((context.getNodeParameter('shortLinks', itemIndex, []) as string[]) ?? [])
		.map((u) => (u ?? '').trim())
		.filter((u) => u.length > 0);

	if (!channels.length && !shortLinks.length) {
		throw new NodeOperationError(context.getNode(), 'Add at least one channel or one Short link', {
			itemIndex,
		});
	}

	input.channels = channels;
	input.startUrls = shortLinks.map((url) => ({ url }));
	input.maxResultsShorts = context.getNodeParameter('maxResultsShorts', itemIndex, 10) as number;
	input.sortChannelShortsBy = context.getNodeParameter(
		'sortChannelShortsBy',
		itemIndex,
		'NEWEST',
	) as string;

	const oldestPostDate = (
		context.getNodeParameter('oldestPostDate', itemIndex, '') as string
	).trim();
	if (oldestPostDate) {
		input.oldestPostDate = oldestPostDate;
	} else {
		delete input.oldestPostDate;
	}

	return input;
}

const resourceProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Short',
				value: 'short',
			},
		],
		default: 'short',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['short'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get shorts from channels or links',
				description: 'Return views, likes, comments, publish dates, hashtags and tags per short',
			},
		],
		default: 'get',
	},
];

const inputProperties: INodeProperties[] = [
	{
		displayName: 'Channels',
		name: 'channels',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'siliconimist',
		default: [],
		description:
			'Channels to read Shorts from: a handle with or without @ (siliconimist, @MrBeast), a channel URL, or a channel ID (UC...). Up to 20 per run.',
	},
	{
		displayName: 'Short Links',
		name: 'shortLinks',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'https://www.youtube.com/shorts/gnuiMgTzKMQ',
		default: [],
		description:
			'Individual Short or video links (/shorts/ID, watch?v=ID or youtu.be/ID) to fetch just those items. Up to 200 per run. The date filter does not apply to links.',
	},
	{
		displayName: 'Maximum Shorts per Channel',
		name: 'maxResultsShorts',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 10,
		description:
			'How many Shorts to return from each channel (1 to 500). Runs stop at 1,000 in total.',
	},
	{
		displayName: 'Sort By',
		name: 'sortChannelShortsBy',
		type: 'options',
		options: [
			{ name: 'Newest', value: 'NEWEST', description: 'Latest uploads first' },
			{ name: 'Oldest', value: 'OLDEST', description: 'Earliest uploads first' },
			{ name: 'Popular', value: 'POPULAR', description: 'Most viewed first' },
		],
		default: 'NEWEST',
		description:
			'The order of the channel Shorts tab. Forced to Newest when a published-after date is set.',
	},
	{
		displayName: 'Only Shorts Published After',
		name: 'oldestPostDate',
		type: 'string',
		placeholder: '7 days',
		default: '',
		description:
			'Keep only Shorts published on or after this date: an absolute date (2025-06-03) or a relative span (7 days, 2 weeks, 3 months). Adds a small per-Short charge.',
	},
];

const outputProperties: INodeProperties[] = [
	{
		displayName: 'Output',
		name: 'output',
		type: 'options',
		options: [
			{ name: 'Raw', value: 'raw', description: 'Every field the Actor returns' },
			{ name: 'Selected Fields', value: 'selected', description: 'Only the fields you pick' },
			{ name: 'Simplified', value: 'simplified', description: 'A small, agent friendly subset' },
		],
		default: 'simplified',
		description: 'How much of each row to return',
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'multiOptions',
		displayOptions: {
			show: {
				output: ['selected'],
			},
		},
		options: [
			{ name: 'Channel Avatar URL', value: 'channelAvatarUrl' },
			{ name: 'Channel Banner URL', value: 'channelBannerUrl' },
			{ name: 'Channel Description', value: 'channelDescription' },
			{ name: 'Channel Description Links', value: 'channelDescriptionLinks' },
			{ name: 'Channel ID', value: 'channelId' },
			{ name: 'Channel Joined Date', value: 'channelJoinedDate' },
			{ name: 'Channel Location', value: 'channelLocation' },
			{ name: 'Channel Name', value: 'channelName' },
			{ name: 'Channel Total Videos', value: 'channelTotalVideos' },
			{ name: 'Channel Total Views', value: 'channelTotalViews' },
			{ name: 'Channel URL', value: 'channelUrl' },
			{ name: 'Channel Username', value: 'channelUsername' },
			{ name: 'Collaborators', value: 'collaborators' },
			{ name: 'Comments Count', value: 'commentsCount' },
			{ name: 'Comments Turned Off', value: 'commentsTurnedOff' },
			{ name: 'Date', value: 'date' },
			{ name: 'Description', value: 'text' },
			{ name: 'Description Links', value: 'descriptionLinks' },
			{ name: 'Duration', value: 'duration' },
			{ name: 'Error Code', value: 'error' },
			{ name: 'Error Note', value: 'note' },
			{ name: 'Hashtags', value: 'hashtags' },
			{ name: 'ID', value: 'id' },
			{ name: 'Input', value: 'input' },
			{ name: 'Is Age Restricted', value: 'isAgeRestricted' },
			{ name: 'Is Channel Verified', value: 'isChannelVerified' },
			{ name: 'Is Members Only', value: 'isMembersOnly' },
			{ name: 'Likes', value: 'likes' },
			{ name: 'Location', value: 'location' },
			{ name: 'Order', value: 'order' },
			{ name: 'Subscribers', value: 'numberOfSubscribers' },
			{ name: 'Tags', value: 'tags' },
			{ name: 'Thumbnail URL', value: 'thumbnailUrl' },
			{ name: 'Title', value: 'title' },
			{ name: 'URL', value: 'url' },
			{ name: 'View Count', value: 'viewCount' },
		],
		default: [],
		description: 'Which fields to keep when Output is set to Selected Fields',
	},
];

const authenticationProperties: INodeProperties[] = [
	{
		displayName: 'Authentication',
		name: 'authentication',
		type: 'options',
		options: [
			{
				name: 'API Key',
				value: 'apifyApi',
			},
			{
				name: 'OAuth2',
				value: 'apifyOAuth2Api',
			},
		],
		default: 'apifyApi',
		description: 'Choose which authentication method to use',
	},
];

export const properties: INodeProperties[] = [
	...authenticationProperties,
	...resourceProperties,
	...inputProperties,
	...outputProperties,
];
