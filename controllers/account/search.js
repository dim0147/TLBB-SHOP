const helper = require('../../help/helper');
const cache = require('../../cache/cache')

exports.renderPage = async function(req, res){
    try{
        const bosungFields = await helper.getBosungFields();
        console.log(req.query);
        res.render('account/search', {title: 'Search', bosungFields: bosungFields});
    }
    catch(err){
        res.status(400).send(err);
    }

}