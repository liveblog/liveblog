type IBlogState = {
    name: string;
    code: string;
    text: string;
};

export const ACTIVE_STATE: IBlogState = {
    name: 'active',
    code: 'open',
    text: gettext('Active blogs'),
};

export const ARCHIVED_STATE: IBlogState = {
    name: 'archived',
    code: 'closed',
    text: gettext('Archived blogs'),
};

export const DELETED_STATE = {
    name: 'deleted',
    code: 'deleted',
    text: gettext('Deleted blogs'),
};
