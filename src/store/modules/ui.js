export default {
  namespaced: true,
  state: {
    snackbar: {
      enabled: false,
      color: "",
      timeout: 0,
      text: "",
      icon: "",
      extra: {}
    },
    outdated: false
  },
  mutations: {
    setSnackbar (state, {color, timeout, text, icon, extra}) {
      state.snackbar.enabled = false;
      state.snackbar.enabled = true;
      state.snackbar.color = color;
      state.snackbar.timeout = timeout;
      state.snackbar.text = text;
      state.snackbar.icon = icon;
      state.snackbar.extra = extra;
    },
    setOutdated (state, value) {
      state.outdated = value
    }
  },
  getters: {
    snackbar: state => state.snackbar,
    outdated: state => state.outdated,
  }
};