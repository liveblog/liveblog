export interface IFilters {
    sort?: string;
    status?: string;
    sticky?: boolean;
    authors?: Array<any>;
    updatedAfter?: string;
    highlight?: boolean;
    excludeDeleted?: boolean;
    syndicationIn?: boolean;
    noSyndication?: boolean;
    scheduled?: boolean;
}
