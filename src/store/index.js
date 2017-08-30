"use strict";
import Vue from 'vue';
import Vuex from 'vuex';

import credentials from './modules/credentials';

Vue.use(Vuex);

export default new Vuex.Store({
  actions: {},
  getters: {},
  modules:{
    credentials
  }
});
