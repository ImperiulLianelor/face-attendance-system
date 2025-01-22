from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import face_recognition
import numpy as np
import os
import traceback
from datetime import date
from sqlalchemy import func, extract
# Initialize Flask app
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://admin:123@localhost/attendance_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_recycle': 299,
    'pool_timeout': 20,
    'pool_pre_ping': True
}

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    photo = db.Column(db.String(200), nullable=False)
    encoding = db.Column(db.LargeBinary, nullable=True)  # Store as bytes

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(10), nullable=False)

# User Registration API
@app.route('/register', methods=['POST'])
def register():
    if 'photo' not in request.files:
        return jsonify({'error': 'Photo file is required'}), 400

    data = request.form
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not (name and email and password):
        return jsonify({'error': 'All fields are required'}), 400

    photo = request.files['photo']
    photo_path = f'photos/{photo.filename}'
    
    try:
        photo.save(photo_path)
        image = face_recognition.load_image_file(photo_path)
        encodings = face_recognition.face_encodings(image)

        if not encodings:
            os.remove(photo_path)
            return jsonify({'error': 'No face detected'}), 400

        # Convert numpy array to bytes
        encoding = encodings[0].tobytes()
    except Exception as e:
        os.remove(photo_path)
        return jsonify({'error': f'Photo processing failed: {str(e)}'}), 500

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    try:
        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            photo=photo_path,
            encoding=encoding
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Registration successful!'}), 201
    except Exception as e:
        db.session.rollback()
        os.remove(photo_path)
        return jsonify({'error': f'Database error: {str(e)}'}), 500


@app.errorhandler(Exception)
def handle_exception(e):
    # Return JSON for all errors
    response = jsonify({
        "error": str(e),
        "message": "Internal server error"
    })
    response.status_code = 500 if not isinstance(e, HTTPException) else e.code
    return response



# Attendance API

@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if not file or file.filename == '':
        return jsonify({'error': 'Invalid file'}), 400

    temp_path = 'temp.jpg'
    try:
        file.save(temp_path)
        uploaded_image = face_recognition.load_image_file(temp_path)
        uploaded_encodings = face_recognition.face_encodings(uploaded_image)

        if not uploaded_encodings:
            return jsonify({'error': 'No faces detected'}), 400

        # Get all valid user encodings
        users = User.query.filter(User.encoding.isnot(None)).all()
        if not users:
            return jsonify({'error': 'No registered users'}), 400

        known_encodings = []
        known_ids = []
        for user in users:
            try:
                # CORRECTED DATA TYPE
                encoding = np.frombuffer(user.encoding, dtype=np.float64)
                
                # SHAPE VALIDATION
                if encoding.shape != (128,):
                    print(f"Skipping invalid encoding for user {user.id}")
                    continue
                    
                known_encodings.append(encoding)
                known_ids.append(user.id)
            except Exception as e:
                print(f"Encoding error - user {user.id}: {str(e)}")
                continue

        if not known_encodings:
            return jsonify({'error': 'No valid face data'}), 400

        attendance_marked = []
        for uploaded_encoding in uploaded_encodings:
            # SHAPE VERIFICATION
            if uploaded_encoding.shape != (128,):
                print("Skipping invalid uploaded encoding")
                continue

            matches = face_recognition.compare_faces(
                known_encodings, 
                uploaded_encoding, 
                tolerance=0.6
            )
            face_distances = face_recognition.face_distance(
                known_encodings, 
                uploaded_encoding
            )

            best_match = np.argmin(face_distances)
            if matches[best_match]:
                user_id = known_ids[best_match]
                today = date.today()

                if not Attendance.query.filter_by(
                    user_id=user_id, 
                    date=today
                ).first():
                    new_attendance = Attendance(
                        user_id=user_id,
                        date=today,
                        status='Present'
                    )
                    db.session.add(new_attendance)
                    attendance_marked.append(user_id)

        db.session.commit()
        return jsonify({
            'message': f'Marked {len(attendance_marked)} attendances',
            'count': len(attendance_marked),
            'users': attendance_marked
        }), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)



#Report API

@app.route('/attendance_report', methods=['GET'])
def attendance_report():
    try:
        timeframe = request.args.get('timeframe', 'daily')
        today = date.today()
        
        # Calculate date range based on timeframe
        if timeframe == 'daily':
            date_filter = (Attendance.date == today)
        elif timeframe == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            date_filter = (Attendance.date >= start_date)
        elif timeframe == 'monthly':
            date_filter = (extract('month', Attendance.date) == today.month)
        else:
            return jsonify({'error': 'Invalid timeframe'}), 400

        report = (
            db.session.query(
                User.name,
                func.count(Attendance.id).label('attendance_count')
            )
            .join(Attendance, User.id == Attendance.user_id)
            .filter(date_filter)
            .group_by(User.id)
            .all()
        )

        return jsonify({
            'report': [{
                'name': item[0],
                'attendance_count': item[1]
            } for item in report]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to generate report',
            'details': str(e)
        }), 500


# Initialize Database
if __name__ == '__main__':
    with app.app_context():
        db.drop_all()
        db.create_all()
    app.run(debug=True) 
