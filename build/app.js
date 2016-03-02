/// <reference path='../typings/main.d.ts' />
"use strict";
var Vue = require('vue');
var VueRouter = require('vue-router');
var VueAsyncData = require('vue-async-data');
Vue.use(VueRouter);
Vue.use(VueAsyncData);
var App = Vue.extend({});
var router = new VueRouter();
Vue.filter('numberDisplay', function (value) {
    if (value < 10) {
        value = '0'.concat(value);
    }
    return value;
});
var homeController = require('../controllers/home');
router.map({
    '/': {
        component: homeController
    }
});
router.start(App, '#app');
