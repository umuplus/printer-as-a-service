'use strict';

class Controller {
    static async index(req, res) {
        res.render('__ui__/index', { layout: 'ui' });
    }
}

module.exports = Controller;
