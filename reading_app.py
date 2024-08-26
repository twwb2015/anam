import os
import random
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OpenAI client
client = OpenAI(
    api_key="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"  # Replace with your actual OpenAI API key
)

def chat_gpt(prompt):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

# Path to the Passages folder
PASSAGES_FOLDER = '/Users/arvindprabhakaran/Documents/Passages'  # Update this path as needed

@app.route('/')
def index():
    return render_template('index.html')  # Renders the main HTML page

@app.route('/get_passage', methods=['GET'])
def get_passage():
    try:
        # List all text files in the folder
        files = [f for f in os.listdir(PASSAGES_FOLDER) if f.endswith('.txt')]
        
        if not files:
            return jsonify({"error": "No passage files found in the directory"}), 404
        
        # Choose a random text file
        chosen_file = random.choice(files)
        with open(os.path.join(PASSAGES_FOLDER, chosen_file), 'r') as file:
            passage = file.read()
        
        return jsonify({"passage": passage})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate_questions', methods=['POST'])
def generate_questions():
    data = request.json
    passage = data.get('passage')

    if not passage:
        return jsonify({"error": "No passage provided"}), 400

    try:
        # Generate questions with options using the chat_gpt function
        prompt = (
            f"Generate 10 multiple-choice questions from the following passage. "
            f"For each question, provide 4 options: one correct answer and three incorrect answers. "
            f"Return the result in the format 'Q: question text\nA) option1\nB) option2\nC) option3\nD) option4'.\n\n"
            f"Passage:\n{passage}"
        )
        questions_text = chat_gpt(prompt)
        
        # Split the questions into individual questions with options
        questions = questions_text.split('\n\n')

        return jsonify({"questions": questions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)