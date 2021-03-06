const initialState = {
  id: '',
  name: '',
  loggedIn: false,
  verifying: true,
};

const userReducer = (state = initialState, action) => {
  switch(action.type) {
    case 'SET_USER':
      state = {
        ...state,
        ...action.payload
      };
      break;
    case 'SET_VERIFYING':
      state = {
        ...state,
        verifying: action.payload
      };
      break;
    case 'VERIFY_USER_FULFILLED':
      state = {
        ...state,
        ...action.payload
      };
      break;
    case 'LOGOUT_USER_FULFILLED':
      state = {
        ...state,
        ...action.payload
      };
      break;

  }
  return state;
};

export default userReducer;
