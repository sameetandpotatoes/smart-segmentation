from sqlitedict import SqliteDict
import string

def clean_data(raw_page_text):
    translator = str.maketrans('', '', string.punctuation)
    page_no_punct = raw_page_text.translate(translator)
    # TODO regex to replace consecutive numbers with hashtag, but then it should join it with the next word
    # return re.sub(r'\d+', '#', page_no_punct)
    return page_no_punct

def insert_data(data):
    reduced_page_text = clean_data(data['cleanedText'])
    lines = reduced_page_text.split('\n')
    sentence_stream = [line.lower().split() for line in lines]

    training_data = sentence_stream
    if 'training_data' in mydict:
	    training_data = mydict.get('training_data', [])
	    training_data.append(sentence_stream)
    print("Storing data...")
    mydict['training_data'] = training_data

def get_training_data():
	print("Retrieving data")
	if 'training_data' not in mydict:
		print("Invalid query to database")
		return None
	else:
		x = mydict.get('training_data', [])
		return x

mydict = SqliteDict('./gensim.sqlite', autocommit=True)