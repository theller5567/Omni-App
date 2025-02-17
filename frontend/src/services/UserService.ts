class UserService {
  private user: { id: string; name: string; email: string } | null = null;

  setUser(user: { id: string; name: string; email: string }) {
    this.user = user;
  }

  getUser() {
    return this.user;
  }

  clearUser() {
    this.user = null;
  }

  // Add more user-related methods as needed
}

export default new UserService(); 