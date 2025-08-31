import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshToken, logout } from '../store/authSlice';
import { RootState, AppDispatch } from '../store/store';

// export default function useAuthRefresh() {
//   const dispatch = useDispatch<AppDispatch>();
//   const { user, refreshToken: rToken } = useSelector((state: RootState) => state.auth);

//   useEffect(() => {
//     if (!user || !rToken) return;

//     const interval = setInterval(() => {
//       dispatch(refreshToken({ userId: user.id, refreshToken: rToken }))
//         .unwrap()
//         .catch(() => {
//           dispatch(logout());
//         });
//     }, 1000 * 60 * 10); // every 10 minutes

//     return () => clearInterval(interval);
//   }, [user, rToken, dispatch]);
// }
export default function useAuthRefresh() {
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(true);
  const refreshTokenValue = useSelector((state: RootState) => state.auth.refreshToken);

  useEffect(() => {
    if (refreshTokenValue) {
      dispatch(refreshToken(refreshTokenValue))
        .unwrap()
        .catch((e) => {
          console.error('Token refresh failed:', e);
        })
        .finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [dispatch, refreshTokenValue]);

  return refreshing;
}