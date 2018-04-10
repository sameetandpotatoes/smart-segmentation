from sqlitedict import SqliteDict

def insert_data(data):
	if mydict['training_data'] is not None:
		print("Appending...")
		training_data = mydict['training_data']
		training_data.append(data)
	print("Storing data...")
	mydict['training_data'] = training_data


mydict = SqliteDict('./gensim.sqlite', autocommit=True)