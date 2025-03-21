import MedicalQuestion from '../models/MedicalQuestion.js';
import User from '../models/User.js';

export const question = async(req, res) =>{
    try{
        const { concern, question } = req.body;       
        // Basic validation
        if (!concern || !question) {
            return res.status(400).json({ message: 'Please provide medical concern and your question' });
        }
                
        // Create a new medical question
        const medicalQuestion = new MedicalQuestion({
            userId: req.user.id,
            concern: concern,
            question: question,
            imageUrl: req.file ? req.file.path : null
        });
        
        await medicalQuestion.save();
        
        res.status(201).json({
            message: 'Your question has been submitted successfully. A doctor will respond soon.',
            questionId: medicalQuestion._id
        });
        
    } catch (error) {
    console.error('Error submitting question:', error);

    // Handle file upload errors
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 20MB.' });
        }
        return res.status(400).json({ message: 'File upload error: ' + error.message });
    }

    res.status(500).json({ message: 'Server error' });
    }   

}


export const myQuestions = async(req,res) =>{
    try {
        const questions = await MedicalQuestion.find({ userId: req.user.id })
          .select('-__v')
          .sort({ createdAt: -1 })
          .exec();
        
        res.json(questions);
      } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Server error' });
      }
}

export const questionDetail = async(req,res) =>{
    try {
        const question = await MedicalQuestion.findById(req.params.id)
          .select('-__v')
          .exec();
        
        if (!question) {
          return res.status(404).json({ message: 'Question not found' });
        }
                
        res.json(question);

    } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Server error' });
    }
}

export const answer = async(req,res) =>{
    try {
        const { answer ,questionId} = req.body;
        
        if (!answer) {
          return res.status(400).json({ message: 'Please provide an answer' });
        }
        if (!questionId) {
            return res.status(400).json({ message: 'Please provide question Id' });
        }

        const question = await MedicalQuestion.findById(questionId);
        
        if (!question) {
          return res.status(404).json({ message: 'Question not found' });
        }
        
        // Update the question with the answer
        question.answer = {
          text: answer,
          answeredAt: Date.now(),
        };
        question.status = 'answered';
        
        await question.save();
        
        res.json({
          message: 'Answer submitted successfully',
          question
        });
        
    } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Server error' });
    }
}
