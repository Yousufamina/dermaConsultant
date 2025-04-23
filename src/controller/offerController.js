import offerSchema from '../models/Offer.js';

export const addOffer = async(req, res) =>{
    try{
        console.log("called add offer")
        const { name, description } = req.body;       
        // Basic validation
        if (!name || !description) {
            return res.status(400).json({ message: 'Please provide name and description' });
        }
                
        // Create a new offer
        const offer = new offerSchema({
            name: name,
            description: description,
            imageUrl: req.file ? req.file.path : null
        });
        
        await offer.save();
        
        res.status(201).json({
            message: 'Offer added successfully.'
        });
        
    } catch (error) {
    console.error('Error adding offer:', error);

    // Handle file upload errors
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ message: 'File upload error: ' + error.message });
    }

    res.status(500).json({ message: 'Server error' });
    }   
}

export const getAllOffers = async(req,res) =>{
    try {
        console.log("Called Get Offer Detail")
        const offers = await offerSchema.find()
          .select('-__v')
          .sort({ createdAt: -1 })
          .exec();
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getOfferDetail = async(req,res) =>{
    try {
        const offer = await offerSchema.findById(req.params.id)
          .select('-__v')
          .exec();
        
        if (!offer) {
          return res.status(404).json({ message: 'Offer not found' });
        }
                
        res.json(offer);

    } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ message: 'Server error' });
    }
}

export const updateOffer = async(req,res) =>{
   try {
        const { name, description } = req.body;       
            // Basic validation
        if (!name || !description) {
            return res.status(400).json({ message: 'Please provide name and description' });
        }
        let offer = await offerSchema.findById(req.params.id);
        if (!offer) {
        return res.status(404).json({ message: 'offer not found' });
        }
        console.log(offer)
        if(req.file){
            offer.imageUrl = req.file.path            
        }
        offer.name = name,
        offer.description =  description,
               
        await offer.save();
        res.json({
            message: 'offer updated successfully',
            offer
        });      
    } catch (error) {
      console.error('Error updating offer:', error);
      res.status(500).json({ message: 'Server error' });
    }  
}

export const deleteOfferByAdmin = async(req,res) =>{
  try {
    const offer = await offerSchema.findOne({ 
      _id: req.params.id,
    });
    
    if (!offer) {
      console.log("offer not found")
      return res.status(404).json({ message: 'offer not found' });
    }
    console.log("Offer deleted successfully")
    
    await offerSchema.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: 'offer deleted successfully'
    })
    
  } catch (error) {
      console.error('Error deleting offer:', error);
      res.status(500).json({ message: 'Server error' });
  } 
}