const axios = require('axios');
const config = require('../config/environment');
const constants = require('../config/constants');
const { User } = require('../models');
const logger = require('../utils/logger');

class OAuthService {
  constructor() {
    this.providers = {
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
        scope: 'profile email',
      },
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scope: 'user:email',
      }
    };
  }

  async normalizeProfile(provider, profile) {
    const baseProfile = {
      provider,
      email: null,
      name: null,
      avatar: null,
      locale: null,
    };

    switch (provider) {
      case constants.AUTH.PROVIDERS.GOOGLE:
        return {
          ...baseProfile,
          oauthId: profile.sub,
          email: profile.email,
          name: profile.name,
          avatar: profile.picture,
          locale: profile.locale,
        };
      
      case constants.AUTH.PROVIDERS.GITHUB:
        return {
          ...baseProfile,
          oauthId: profile.id.toString(),
          email: profile.email || `${profile.login}@github.user`,
          name: profile.name || profile.login,
          avatar: profile.avatar_url,
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async exchangeCodeForToken(provider, code) {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (provider === constants.AUTH.PROVIDERS.GOOGLE) {
      console.log('Exchanging Google code for token, code:', code.substring(0, 20) + '...');
      
      const tokenParams = new URLSearchParams();
      tokenParams.append('client_id', config.GOOGLE_CLIENT_ID);
      tokenParams.append('client_secret', config.GOOGLE_CLIENT_SECRET);
      tokenParams.append('code', code);
      tokenParams.append('redirect_uri', config.GOOGLE_CALLBACK_URL);
      tokenParams.append('grant_type', 'authorization_code');

      try {
        console.log('Sending Google token request to:', providerConfig.tokenUrl);
        const response = await axios.post(providerConfig.tokenUrl, tokenParams.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        console.log('Google token response received, access token:', response.data.access_token ? 'Present' : 'Missing');
        return response.data.access_token;
      } catch (error) {
        console.error('Google token exchange failed:', error.response?.data || error.message);
        logger.error(`Token exchange failed for ${provider}:`, error.response?.data || error.message);
        throw new Error(`Failed to exchange code for token: ${error.response?.data?.error_description || error.message}`);
      }
    } else if (provider === constants.AUTH.PROVIDERS.GITHUB) {
      console.log('Exchanging GitHub code for token, code:', code.substring(0, 20) + '...');
      
      const tokenParams = {
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: config.GITHUB_CALLBACK_URL,
      };

      try {
        console.log('Sending GitHub token request to:', providerConfig.tokenUrl);
        const response = await axios.post(providerConfig.tokenUrl, tokenParams, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('GitHub token response received, access token:', response.data.access_token ? 'Present' : 'Missing');
        return response.data.access_token;
      } catch (error) {
        console.error('GitHub token exchange failed:', error.response?.data || error.message);
        logger.error(`Token exchange failed for ${provider}:`, error.response?.data || error.message);
        throw new Error(`Failed to exchange code for token: ${error.response?.data?.error_description || error.message}`);
      }
    }
  }

  async getUserInfo(provider, accessToken) {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    try {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      };

      let userInfo;
      
      if (provider === constants.AUTH.PROVIDERS.GOOGLE) {
        console.log('Getting Google user info with token:', accessToken.substring(0, 20) + '...');
        const response = await axios.get(providerConfig.userInfoUrl, { headers });
        userInfo = response.data;
        console.log('Google user info received:', { email: userInfo.email, name: userInfo.name });
      } else if (provider === constants.AUTH.PROVIDERS.GITHUB) {
        console.log('Getting GitHub user info with token:', accessToken.substring(0, 20) + '...');
        const response = await axios.get(providerConfig.userInfoUrl, { headers });
        userInfo = response.data;
        
        if (!userInfo.email) {
          console.log('No email in GitHub response, fetching emails...');
          const emailsResponse = await axios.get('https://api.github.com/user/emails', { headers });
          const primaryEmail = emailsResponse.data.find(email => email.primary);
          userInfo.email = primaryEmail ? primaryEmail.email : `${userInfo.login}@github.user`;
        }
        console.log('GitHub user info received:', { email: userInfo.email, name: userInfo.name });
      }

      return this.normalizeProfile(provider, userInfo);
    } catch (error) {
      console.error(`Failed to get user info from ${provider}:`, error.response?.data || error.message);
      logger.error(`Failed to get user info from ${provider}:`, error.response?.data || error.message);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  async handleOAuthCallback(provider, code, deviceInfo = {}, ipAddress = null) {
    try {
      console.log(`Handling OAuth callback for ${provider} with code length: ${code.length}`);
      
      const accessToken = await this.exchangeCodeForToken(provider, code);
      console.log(`Got access token for ${provider}: ${accessToken.substring(0, 20)}...`);
      
      const userProfile = await this.getUserInfo(provider, accessToken);
      console.log(`Got user profile for ${provider}:`, { 
        email: userProfile.email, 
        name: userProfile.name,
        oauthId: userProfile.oauthId 
      });

      if (!userProfile.email) {
        throw new Error('No email found in OAuth profile');
      }

      const existingUser = await User.findOne({ 
        $or: [
          { email: userProfile.email },
          { oauthId: userProfile.oauthId, provider }
        ]
      });

      let user = existingUser;
      let isNewUser = false;

      if (!existingUser) {
        console.log(`Creating new user for ${provider}: ${userProfile.email}`);
        user = new User({
          oauthId: userProfile.oauthId,
          provider,
          email: userProfile.email,
          name: userProfile.name,
          avatar: userProfile.avatar,
          locale: userProfile.locale,
          timezone: this.detectTimezone(deviceInfo),
          firstLoginDate: new Date(),
          lastLogin: new Date(),
          loginCount: 1,
          onboardingCompleted: false,
          onboardingStep: 0,
        });
        isNewUser = true;
      } else {
        console.log(`Updating existing user for ${provider}: ${userProfile.email}`);
        if (existingUser.provider !== provider && existingUser.oauthId !== userProfile.oauthId) {
          throw new Error('Account exists with different provider');
        }

        user.name = userProfile.name || user.name;
        user.avatar = userProfile.avatar || user.avatar;
        user.locale = userProfile.locale || user.locale;
        user.lastLogin = new Date();
        user.loginCount += 1;
        user.timezone = user.timezone || this.detectTimezone(deviceInfo);
      }

      await user.updateLastLogin({
        sessionId: this.generateSessionId(),
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress,
      });

      await user.save();
      console.log(`User saved successfully: ${user.email}`);

      return {
        user,
        isNewUser,
        profile: userProfile,
      };
    } catch (error) {
      console.error(`OAuth callback failed for ${provider}:`, error.message);
      logger.error(`OAuth callback failed for ${provider}:`, error);
      throw error;
    }
  }

  detectTimezone(deviceInfo) {
    try {
      if (deviceInfo.timezone) {
        return deviceInfo.timezone;
      }
      
      return 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }

  generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  async linkProvider(userId, provider, code) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.provider === provider) {
        throw new Error('Provider already linked');
      }

      const accessToken = await this.exchangeCodeForToken(provider, code);
      const userProfile = await this.getUserInfo(provider, accessToken);

      if (!userProfile.email) {
        throw new Error('No email found in OAuth profile');
      }

      if (user.email.toLowerCase() !== userProfile.email.toLowerCase()) {
        throw new Error('Email does not match existing account');
      }

      user.provider = provider;
      user.oauthId = userProfile.oauthId;
      await user.save();

      return true;
    } catch (error) {
      logger.error(`Failed to link provider ${provider}:`, error);
      throw error;
    }
  }
}

module.exports = new OAuthService();