# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from superdesk import get_resource_service


def get_advertisements_list(output):
    """
    Tries to extract the ads collection from a given output. If not collection
    is found it will return an empty list

    :param context: output `dict` comming from DB query using find_one method
                    on resource service
                    example: get_resource_service('outputs').find_one(req=None, _id=output_id)
    """

    ads = []

    if output and output.get('collection', False):
        ads_ids = output['collection'].get('advertisements', [])
        ads_ids = list(map(lambda x: x['advertisement_id'], ads_ids))

        ads_query = get_resource_service('advertisements').find({"_id": {"$in": ads_ids}})
        ads = list(ads_query)

    return ads
