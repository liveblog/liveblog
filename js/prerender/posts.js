var endpoint = theme.LB.api = "https://dpa-api.liveblog.pro/api/client_blogs/";
var query = {
  "query": {
    "filtered": {
      "filter": {
        "and": [
          {"term": {"sticky": true}},
          {"term": {"post_status": "open"}},
          {"not": {"term": {"deleted": true}}}
        ]
      }
    }
  },
  "sort":[{
    "order": {
      "order": "desc",
      "missing": "_last",
      "unmapped_type": "long"
    }
  }]
}