# Motivation

The motivation for this script is to have a small dataset in which we can continually test our gensim model.

This will have quantitative results that we can use to keep track of how our model improves over time.

# Structure

`raw_page_data.dat`: Taken directly from the chrome extension, the raw page text data of various shopping websites.
`test_segs.dat`: Related products of those pages, seeing how they segment given the raw page data

# Setup

This can be run on the vagrant box.

```
python3 eval_model.py
```
