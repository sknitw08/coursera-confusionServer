const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorites = require('./../models/favorite');
const Dishes = require('./../models/dishes');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user.id})
        .populate('user')
        .populate('dishes')
        .then((favorites) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        }, (err) => next(err))
        .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({user: req.user.id})
            .then((favorite) => {
                if (!favorite) {
                    Favorites.create({user: req.user._id})
                        .then((favorite) => {
                            for (dish of req.body) {
                                if (favorite.dishes.find((dishId) => dishId.toString() === dish._id.toString()))
                                    continue;
                                favorite.dishes.push(dish);
                            }
                            favorite.save()
                                .then((favorites) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorites);
                                }, (err) => next(err))
                        }, (err) => next(err))
                } else {
                    for (dish of req.body){
                        if (favorite.dishes.find((dishId) => dishId.toString() === dish._id.toString()))
                            continue;
                        favorite.dishes.push(dish);
                    }
                    favorite.save()
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                }
            },(err) => next(err))
            .catch((err) => next(err));
    })

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation is not supported on /favorites/:dishId');
})
.post(cors.corsWithOptions, authenticate.verifyUser, 
    (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (dish == null) {
                    let err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                Favorites.findOne({user: req.user.id})
                    .then((favorite) => {
                        if (favorite != null) {
                            if (favorite.dishes.find((dishId) => dishId.toString() === dish._id.toString()))
                            {
                                let err = new Error('Dish: ' +req.params.dishId+' is already in the favorite list')
                                err.status = 403;
                                return next(err);
                            }
                            favorite.dishes.push(dish._id);
                            favorite.save()
                                .then((favorites) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorites);
                                }, (err) => next(err))
                        } else {
                            Favorites.create({user: req.user._id})
                                .then((favorite) => {
                                    favorite.dishes.push({_id: dish._id});
                                    favorite.save()
                                        .then((favorites) => {
                                            res.statusCode = 200;
                                            res.setHeader("Content-Type", "application/json");
                                            res.json(favorites);
                                        }, (err) => next(err))
                                }, (err) => next(err))
                        }
                    }, err => next(err))
            }, err => next(err))
            .catch((err) => next(err));
    })

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites/:dishId');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user.id})
    .then((favorite) => {
        let isPresent = false;
        for (let i = (favorite.dishes.length - 1); i >= 0; i--) {
            if (favorite.dishes[i] == req.params.dishId) {
                isPresent = true;
                favorite.dishes.splice(i, 1);
            }
        }
        if (!isPresent) {
            let err = new Error('Dish: ' +req.params.dishId+' is not present in the favorite list')
            err.status = 403;
            return next(err);
        }
        favorite.save()
        .then((favorites) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorites);
        }, err => next(err))
    }, err => next(err))
    .catch((err) => next(err));
})

module.exports = favoriteRouter;