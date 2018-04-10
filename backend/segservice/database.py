from sqlitedict import SqliteDict
import string

def clean_data(raw_page_text):
    translator = str.maketrans('', '', string.punctuation)
    page_no_punct = raw_page_text.translate(translator)
    # TODO regex to replace consecutive numbers with hashtag, but then it should join it with the next word
    # return re.sub(r'\d+', '#', page_no_punct)
    return page_no_punct

def insert_page_data(data):
    reduced_page_text = clean_data(data['cleanedText'])
    reduced_page_text = reduced_page_text.encode('utf-8').decode()
    lines = reduced_page_text.split('\n')
    sentence_stream = [line.lower().split() for line in lines]

    training_data = sentence_stream
    if 'training data' in sqliteDict:
	    training_data = sqliteDict.get('training data', [])
	    training_data.append(sentence_stream)
    sqliteDict['training data'] = training_data

def get_training_data():
	if 'training data' not in sqliteDict:
		print("Invalid query to database")
		return None
	else:
		x = sqliteDict.get('training data', [])
		return x

def insert_segmentation_data(user_selection, segmentation):
	# user_selection -> (segmentation, frequency)
	user_selection = user_selection.encode('utf-8').decode()
	user_key = "user " + user_selection
	if user_key in sqliteDict:
		frequency_dict = sqliteDict[user_key]
		if segmentation in frequency_dict:
			frequency_dict[segmentation] +=1
		else:
			frequency_dict[segmentation] = 1
		sqliteDict[user_key] = frequency_dict
	else:
		sqliteDict[user_key] = {segmentation:1}

	# segmentation -> frequency
	segmentation = segmentation.encode('utf-8').decode()
	segmentation_key = "segmentation " + segmentation
	frequency = sqliteDict.get(segmentation_key, 0)
	frequency += 1
	sqliteDict[segmentation_key] = frequency

def print_segmentation_data():
	print("Segmentation frequency:")
	for key in sqliteDict:
		print("key: " + key)
		print(sqliteDict[key])

sqliteDict = SqliteDict('./gensim.sqlite', autocommit=True)