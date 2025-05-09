from flask import Flask, request, jsonify
from models import load_model, predict

app = Flask(__name__)

# Initialize AI models
model = load_model()

@app.route('/api/predict', methods=['POST'])
def make_prediction():
    data = request.json
    prediction = predict(model, data)
    return jsonify(prediction)

if __name__ == '__main__':
    app.run(debug=True)