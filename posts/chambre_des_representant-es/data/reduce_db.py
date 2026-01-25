import sqlite3
import pandas as pd

con = sqlite3.connect('chambre.sqlite3')
interventions = pd.read_sql('SELECT * FROM interventions', con=con)

def count_word(text):
    if ' ' not in text:
        return 1
    else:
        return len(text.split())

interventions['word_count'] = interventions.content.apply(count_word)
interventions.drop('content', axis='columns', inplace=True)

interventions.subject_id = interventions.subject_id.astype(int)

print(interventions.head())

interventions.to_sql('interventions', con=con, if_exists='replace', index=False)
con.close()