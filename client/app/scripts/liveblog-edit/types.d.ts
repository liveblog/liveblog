export interface IFilters {
    sort?: string;
    status?: string;
    sticky?: boolean;
    authors?: any[];
    updatedAfter?: string;
    highlight?: boolean;
    excludeDeleted?: boolean;
    syndicationIn?: boolean;
    noSyndication?: boolean;
    scheduled?: boolean;
    maxPublishedDate?: string;
}
