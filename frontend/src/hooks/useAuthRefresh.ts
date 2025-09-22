import { useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { refreshToken, fetchUser } from '../store/authSlice';
import { RootState } from '../store/store';


export default function useAuthRefresh() {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token, shallowEqual);
  const refreshTokenValue = useSelector((state: RootState) => state.auth.refreshToken, shallowEqual);
  const user = useSelector((state: RootState) => state.auth.user, shallowEqual);

  useEffect(() => {
    if (!token && refreshTokenValue) {
      dispatch(refreshToken())
        .unwrap()
        .then(() => dispatch(fetchUser()))
        .catch((err: any) => {
          console.log("🚀 ~ useAuthRefresh ~ err:", err)
        });
    }
    // If there's a token but no user info, fetch user
    else if (token && !user) {
      dispatch(fetchUser());
    }
  }, []);
}