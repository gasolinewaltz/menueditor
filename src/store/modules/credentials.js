"use strict";

var state = {
  username: '',
  token: ''
};

var getters = {
  getUsernameToken: state =>{
    return {
      username: state.username,
      token   : state.token
    }
  }
};

var mutations = {

  update(state, user){
    state.username = user.username;
    state.token    = user.token;
  },
  clearToken(state){
    state.token = "";
    localStorage.setItem('token', '');
  }
};

var actions = {
  checkCache({commit}){
    var username = localStorage.getItem('username'),
        token    = localStorage.getItem('token'),
        response = null;

    if (token) {
      commit('update', {username, token});
      return Promise.resolve({username, token});
    } else {
      return Promise.reject();
    }
  },
  updateAndCache({commit}, user){
    commit('update', user);

    localStorage.setItem('username', user.username);
    localStorage.setItem('token', user.token);
  }
};

export default{
  state,
  getters,
  mutations,
  actions
}
