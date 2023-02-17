const User = require('../models/User')
const Item = require('../models/Item')
const asyncHandler = require('express-async-handler')
const Cart = require('../models/Cart')


const getCartDetails = asyncHandler (async (req,res) => {
    const {username} = req.params
    const user = await User.findOne({username}).lean().exec()
    const cart = await Cart.findOne({user:user._id}).lean().exec() ?? []
    const itemIds = cart?.items?.map(item => item.itemId)
    const itemObjects =await  Item.find().where('itemId').in(itemIds).exec() ?? []
    const b = [1]
    const changedItemObjects = itemObjects.map((itemObject,i) => {
        const newItemObject = {...itemObject._doc, cartQuantity: cart.items[i].quantity}
        console.log(newItemObject)
        return newItemObject
    })
    cart.itemObjects = changedItemObjects
    if (!cart){
        return res.status(400).json({message: 'No Cart found for this User'})
    }
    res.json(cart)

})


const createCartforUser = asyncHandler (async (req,res) => {
    const {username} = req.body
    if (!username){
        return res.status(400).json({message:'Username required'})
    }
    const user = await User.findOne({username}).lean().exec()
    const cartObject = {items:[],user:user}
    const existingCart= await Cart.findOne({user}).lean().exec()
    if (existingCart){
        return res.status(409).json({message:'Cart already exists for this user'})
    }
    const cart = await Cart.create(cartObject)
    if (cart){
        res.status(201).json({message:`New Cart created for ${username}`})
    }
    else{
        res.status(400).json({message:"Invalid cart data recieved"})
    }
})
const updateCartDetails = asyncHandler (async (req,res) => {
    const {itemId,discountPrice,deliveryCharge,username,direction} = req.body
    if (!username){
        return res.status(400).json({message:'Username is required'})
    }
    const user =  await User.findOne({username}).lean().exec()
    if (!user){
        return res.status(400).json({message:'Wrong username'})
    }
    const cart = await Cart.findOne({user}).exec()
    if (!cart){
        return res.status(400).json({message:'No existing cart for current User'})
    }
    const item = (itemId)!==undefined ? await Item.findOne({itemId}).lean().exec() : undefined

    cart.discountPrice = discountPrice ?? cart.discountPrice
    cart.deliveryCharge = deliveryCharge ?? cart.deliveryCharge
    if (item){
        const existingItem = cart.items.find(item => item.itemId === itemId)

        if (existingItem && direction =='add'){
            existingItem.quantity += 1
            if (existingItem.quantity > item.inventory){
                return res.status(400).json({message:'Inventory not available'})
            }
        }
        else if (existingItem && direction=='remove'){
            existingItem.quantity -= 1
        }
        else if (existingItem && direction ==undefined){
             return res.status(400).json({message:'Direction required'})
        }
        else{
            if (item.inventory>0){
                cart.items.push({itemId})
            }
            else{
                return res.status(400).json({message:'Inventory not available'})
            }
        }
        if (existingItem && existingItem?.quantity===0){
            const newCartItems = cart.items.filter(r => r!== existingItem)
            cart.items = newCartItems
        }
    }
    await cart.save()
    res.json({message:`Cart of ${username} updated`})
})
const clearCartDetails = asyncHandler (async (req,res) => {
    const {username} = req.body
    if (!username){
        return res.status(400).json({message:'Username required'})
    }
    const user = await User.findOne({username}).lean().exec()
    const cart = await Cart.findOne({user}).exec()
    cart.items = []
    cart.discountPrice = 0
    cart.deliveryCharge = 0
    await cart.save()
    res.json({message:`Cart of ${username} Cleared`})
})
const deleteCart = asyncHandler (async (req,res) => {
    const {username} = req.body
    if (!username){
        return res.status(400).json({message:'Username required'})
    }
    const user = await User.findOne({username}).lean().exec()
    const cart = await Cart.findOne({user}).exec()
    await cart.deleteOne()
    res.json(`Cart of ${username} Deleted`)
})
module.exports = {createCartforUser,getCartDetails,updateCartDetails,deleteCart,clearCartDetails}