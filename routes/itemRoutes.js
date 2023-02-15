const express = require('express')
const router = express.Router()
const itemController = require('../controllers/itemControllers')



router.route('/')
    .get(itemController.getAllItems)
    .post(itemController.createNewItem)
    .patch(itemController.updateItem)
    .delete(itemController.deleteItem)
router.route('/:itemId').get(itemController.getItembyItemId)
module.exports = router