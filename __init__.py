from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import sys
import uuid
import json
from werkzeug.debug import console

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('main.html')


@app.route('/get_response/', methods=['POST'])
def get_response():
    outputs = "passed the audio file"

    try:
        user_text_msg = request.form['message']
        print(user_text_msg)
    except:
        file = request.files['audio_data']
        print("---------------------------------")
        print(file)
        filename = datetime.now().strftime("%m-%d-%Y-%H-%M-%S") + '.mp3'

        file.save(os.path.join('audiofile/', filename))
    return render_template('msg.html', outputs=outputs)


if __name__ == '__main__':
    app.run(debug=True)
