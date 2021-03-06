"use strict";
import Vue from 'vue';
import Vuex from 'vuex';

import credentials from './modules/credentials';
import menuCache from './modules/menuCache';
import changesMade from './modules/changesMade';
import itemList from './modules/itemList';

Vue.use(Vuex);

export default new Vuex.Store({
  actions: {},
  getters: {},
  modules:{
    credentials,
    menuCache,
    changesMade,
    itemList
  }
});
