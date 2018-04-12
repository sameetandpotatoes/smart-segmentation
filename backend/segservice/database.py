from sqlitedict import SqliteDict
import string

user_key_prefix = "user "
segmentation_key_prefix = "seg "

def clean_page_data(raw_page_text):
    translator = str.maketrans('', '', string.punctuation)
    page_no_punct = raw_page_text.translate(translator)
    cleaned_data = clean_data(page_no_punct)
    return cleaned_data

def clean_data(text):
    # TODO regex to replace consecutive numbers with hashtag, but then it should join it with the next word
    # return re.sub(r'\d+', '#', page_no_punct)
    text = text.encode('utf-8').decode()
    return text

def insert_page_data(data):
    reduced_page_text = clean_data(data)
    lines = reduced_page_text.split('\n')

    training_data = sqliteDict.get('training data', [])
    for line in lines:
    	training_data.append(line.lower().split())
    print(training_data)
    sqliteDict['training data'] = training_data

def get_training_data():
	if 'training data' not in sqliteDict:
		print("Invalid query to database")
		return None
	else:
		x = sqliteDict.get('training data', [])
		return x

def insert_segmentation_feedback(user_selection, segmentation):
	# user_selection -> (segmentation, frequency)
	user_selection = clean_data(user_selection)
	user_key = get_user_selection_key(user_selection)
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
	segmentation = clean_data(segmentation)
	segmentation_key = get_segmentation_key(segmentation)
	frequency = sqliteDict.get(segmentation_key, 0)
	frequency += 1
	sqliteDict[segmentation_key] = frequency

def get_segmentation(segmentation, user_selection):
	segmentation_key = get_segmentation_key(segmentation)
	segmentation_frequency = sqliteDict.get(segmentation_key, 0)
	user_and_segmentation_frequency = sqliteDict.get(get_user_selection_key(user_selection), {segmentation_key, 0})[segmentation]
	return (user_and_segmentation_frequency, segmentation_frequency)

def get_segmentation_key(segmentation):
	return segmentation_key_prefix + segmentation

def get_user_selection_key(user_selection):
	return user_key_prefix + user_selection

sqliteDict = SqliteDict('./gensim.sqlite', autocommit=True)