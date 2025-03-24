import { auth } from '../../firebase/firebaseConfig';

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || '';
    this.displayName = data.displayName || '';
    this.photoURL = data.photoURL || '';
  }

  static async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        if (user) {
          resolve(new User({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }));
        } else {
          resolve(null);
        }
      }, reject);
    });
  }

  static async findOne(id) {
    try {
      const user = await auth.getUser(id);
      return new User({
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  static async create(userData) {
    try {
      const { user } = await auth.createUserWithEmailAndPassword(userData.email, userData.password);
      if (userData.displayName) {
        await user.updateProfile({ displayName: userData.displayName });
      }
      return new User({
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async update(data) {
    try {
      const updates = {};
      if (data.displayName) updates.displayName = data.displayName;
      if (data.photoURL) updates.photoURL = data.photoURL;

      await auth.currentUser.updateProfile(updates);
      Object.assign(this, updates);
      return this;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

export default User; 