import { Conversation } from "../Models/conversationModel.js";
import { Message } from "../Models/messageModel.js";
import { getReceiverSocketId, io } from "../Socket/socket.js";

export const sendMessage = async (req,res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const {message} = req.body;

        let gotConversation = await Conversation.findOne({
            participants:{$all : [senderId, receiverId]},
        });

        if(!gotConversation){
            gotConversation = await Conversation.create({
                participants:[senderId, receiverId]
            })
        };
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });
        if(newMessage){
            gotConversation.messages.push(newMessage._id);
        };
        

        await Promise.all([gotConversation.save(), newMessage.save()]);
         
        // SOCKET IO
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        return res.status(201).json({
            newMessage
        })
    } catch (error) {
        console.log(error);
    }
}
export const getMessage = async (req,res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.id;
        const conversation = await Conversation.findOne({
            participants:{$all : [senderId, receiverId]}
        }).populate("messages");                                //// .populate(id) Important Concept in MongoDB, used for getting object directly through the IDs
        return res.status(200).json(conversation?.messages);
    } catch (error) {
        console.log(error);
    }
}