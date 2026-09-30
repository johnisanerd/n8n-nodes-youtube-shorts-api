# n8n-nodes-youtube-shorts-api

An n8n community node for the **YouTube Shorts API** on [Apify](https://apify.com?fpr=9n7kx3). Give it channels or Short links and it returns YouTube Shorts analytics as structured JSON: views, likes, comment counts, exact publish dates, durations, hashtags and the creator's tags for every Short, plus the channel's subscribers and total views. Works for channels you do not own; no YouTube API key or quota.

Not affiliated with, endorsed by, or connected to YouTube or Google. It reads the public Shorts tab and Short pages.

## Install

In n8n: **Settings → Community Nodes → Install**, then enter:

```
n8n-nodes-youtube-shorts-api
```

Accept the risk prompt and restart if asked. Self-hosted n8n only.

## Credentials

The node uses your Apify credential, either an API key or OAuth2.

1. Get a free Apify account: https://apify.com?fpr=9n7kx3
2. Copy your token from https://console.apify.com/settings/integrations
3. In n8n, add an **Apify API** credential and paste the token.

## Parameters

| Field | Type | Default | Notes |
|---|---|---|---|
| Channels | string list | empty | Handle with or without @ (`siliconimist`, `@MrBeast`), channel URL, or channel ID (`UC...`). Up to 20 per run. |
| Short Links | string list | empty | `/shorts/ID`, `watch?v=ID` or `youtu.be/ID` links. Up to 200 per run. Give at least one channel or one link. |
| Maximum Shorts per Channel | number | 10 | 1 to 500 per channel; runs stop at 1,000 Shorts |
| Sort By | options | Newest | Newest, Oldest, or Popular (the channel page's sort buttons) |
| Only Shorts Published After | string | empty | `2025-06-03` or a span such as `7 days`, `2 weeks`, `3 months`. Forces Newest order and adds a small per-Short charge. |
| Output | options | Simplified | Simplified, Raw, or Selected Fields |

## Output

One item per Short. A channel or link that cannot be read returns an item with `error` (for example `CHANNEL_DOES_NOT_EXIST`, `CHANNEL_HAS_NO_SHORTS`, `DATE_FILTER_TOO_STRICT`, `VIDEO_UNAVAILABLE`) and a readable `note`; those rows are not charged.

| Field | Description |
|---|---|
| `id`, `url`, `title` | The Short |
| `date` | Publish time, ISO 8601 UTC (for example `2026-09-27T22:26:20.000Z`) |
| `duration` | Length as `HH:MM:SS` |
| `viewCount`, `likes` | Exact counts at fetch time |
| `commentsCount`, `commentsTurnedOff` | Comment count (null when comments are off) |
| `hashtags` | Hashtags from the title and description, with the # sign |
| `tags` | The keywords the creator set in YouTube Studio; empty when none |
| `text`, `descriptionLinks`, `thumbnailUrl` | Description, its links, and the thumbnail |
| `channelName`, `channelUsername`, `channelId`, `channelUrl` | The channel |
| `numberOfSubscribers`, `channelTotalViews`, `channelTotalVideos` | Channel size |
| `channelDescription`, `channelDescriptionLinks`, `channelJoinedDate`, `channelLocation`, `isChannelVerified` | Channel About section |
| `isAgeRestricted`, `isMembersOnly`, `order`, `input` | Flags and provenance |

Set **Output** to `Simplified` for a small agent friendly object (id, url, title, date, duration, views, likes, comments, hashtags, tags, channel name and subscribers), `Raw` for every field, or `Selected Fields` to pick your own. Simplified is forced when the node runs as an AI Agent tool.

## Example workflows

**1. Weekly YouTube Shorts analytics sheet for competitors**

Schedule Trigger (weekly) → YouTube Shorts (Channels: your competitors, Only Shorts Published After: `7 days`) → Google Sheets (append). Each run adds a dated snapshot of views, likes and comments per Short.

**2. Best hashtags for YouTube Shorts in your niche**

Manual Trigger → YouTube Shorts (Channels: five top channels in the niche, Sort By: Popular, Maximum Shorts per Channel: 50) → Split Out (field: `hashtags`) → Summarize (count by `hashtags`) → Google Sheets.

**3. Exact upload dates for a list of links**

Google Sheets (read a column of Short URLs) → YouTube Shorts (Short Links: the column) → Google Sheets (write `date`, `channelName` and `viewCount` back).

**4. AI Agent tool**

Add the node as a tool to an AI Agent and ask: "Which of the last 20 Shorts from @siliconimist had the best engagement rate?" The agent gets the Simplified rows and does the arithmetic.

## Pricing

The Actor is pay per result on Apify: you are billed for each Short returned, plus a small date-filter event per Short only when Only Shorts Published After is set. Error rows are free. See the [Actor page](https://apify.com/johnvc/youtube-shorts-api?fpr=9n7kx3) for current rates.

## Links

- Actor: https://apify.com/johnvc/youtube-shorts-api?fpr=9n7kx3
- Python and MCP examples: https://github.com/johnisanerd/Apify-YouTube-Shorts-API
- Transcripts for the same Shorts: https://apify.com/johnvc/YoutubeTranscripts?fpr=9n7kx3
- Apify n8n docs: https://docs.apify.com/platform/integrations/n8n
- n8n community nodes: https://docs.n8n.io/integrations/community-nodes/installation/

## License

MIT
Last Updated: 2026.09.30
