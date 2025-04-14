export const TAGS = 'global_tags';
export const ALLOW_PICK_MULTI_TAGS = 'allow_multiple_tag_selection';
export const YOUTUBE_PRIVACY_STATUS = 'youtube_privacy_status';
export const EMBED_HEIGHT_RESPONSIVE_DEFAULT = 'embed_height_responsive_default';

export enum EventNames {
    Connected = 'connected',
    Disconnected = 'disconnected',
    EmbedGenerationError = 'embed_generation_error',
    RemoveTimelinePost = 'removing_timeline_post',

    // TODO: we should change these below to something more meaninful
    Blog = 'blog',
    Posts = 'posts',
    InstanceSettingsUpdated = 'instance_settings:updated'
}
