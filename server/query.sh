curl -X GET 'localhost:9200/liveblog/archive/_search?pretty' -d '
{
  "query": {
    "filtered": {
      "filter": {
        "and": [
          {"term":{"sticky":false}},
          {"term":{"post_status":"open"}}
        ]
      }
    }
  },
  "post_filter": {
    "terms": {"tags": ["Politics"]}
  }
}'


curl -X GET 'http://data-sd:9200/__all__/_search?pretty' -d '
{
  "query": {
    "filtered": {
      "filter": {
        "and": [
          {
            "term": {
              "sticky": false
            }
          },
          {
            "term": {
              "post_status": "open"
            }
          },
          {
            "not": {
              "term": {
                "deleted": true
              }
            }
          }
        ]
      }
    }
  },
  "sort": [
    {
      "published_date": {
        "order": "desc",
        "missing": "_last",
        "unmapped_type": "long"
      }
    }
  ],
  "post_filter": {
    "terms": {
      "tags": [
        "Politics"
      ]
    }
  }
}
'

curl