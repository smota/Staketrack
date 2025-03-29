<template>
  <div class="login">
    <v-container>
      <v-row justify="center" align="center">
        <v-col
          cols="12"
          sm="10"
          md="8"
          lg="6"
        >
          <v-card class="mt-5">
            <v-card-title class="text-h4 text-center">
              Sign In to StakeTrack
            </v-card-title>
            <v-card-subtitle class="text-center mb-4">
              Access your stakeholder maps and data
            </v-card-subtitle>

            <v-card-text>
              <v-form
                ref="form"
                v-model="isFormValid"
                lazy-validation
                @submit.prevent="submitForm"
              >
                <v-text-field
                  v-if="authMethod === 'email'"
                  v-model="email"
                  :rules="emailRules"
                  label="Email"
                  prepend-icon="mdi-email"
                  required
                />

                <v-text-field
                  v-if="authMethod === 'email'"
                  v-model="password"
                  :rules="passwordRules"
                  label="Password"
                  prepend-icon="mdi-lock"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append="showPassword = !showPassword"
                />

                <div class="text-center">
                  <v-btn
                    v-if="authMethod === 'email'"
                    color="primary"
                    block
                    :loading="isLoading"
                    :disabled="!isFormValid || isLoading"
                    type="submit"
                    class="mb-4"
                  >
                    Sign In with Email
                  </v-btn>
                </div>

                <div class="text-center">
                  <p class="text-body-2 mb-4">
                    Or continue with
                  </p>

                  <v-btn
                    block
                    color="red darken-1"
                    class="white--text mb-3"
                    prepend-icon="mdi-google"
                    :loading="isLoadingGoogle"
                    @click="signInWithGoogle"
                  >
                    <v-icon left>
                      mdi-google
                    </v-icon>
                    Google
                  </v-btn>

                  <v-btn
                    block
                    color="primary"
                    variant="outlined"
                    class="mb-3"
                    :loading="isLoadingAnonymous"
                    @click="signInAnonymously"
                  >
                    <v-icon left>
                      mdi-incognito
                    </v-icon>
                    Continue Anonymously
                  </v-btn>
                </div>
              </v-form>

              <v-alert
                v-if="error"
                type="error"
                class="mt-4"
              >
                {{ error }}
              </v-alert>

              <div class="text-center mt-6">
                <p class="text-body-2">
                  Don't have an account?
                  <a href="#" @click.prevent="toggleAuthMode">Sign up</a>
                </p>
                <p class="text-caption text-secondary mt-2">
                  By signing in, you agree to our
                  <a href="#" @click.prevent>Terms of Service</a> and
                  <a href="#" @click.prevent>Privacy Policy</a>
                </p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth, storage } from '@/firebase'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const form = ref(null)

    // Form variables
    const authMethod = ref('email')
    const authMode = ref('signin') // signin or signup
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const isFormValid = ref(true)

    // Loading states
    const isLoading = ref(false)
    const isLoadingGoogle = ref(false)
    const isLoadingAnonymous = ref(false)

    // Error handling
    const error = ref(null)

    // Validation rules
    const emailRules = [
      v => !!v || 'Email is required',
      v => /.+@.+\..+/.test(v) || 'Email must be valid'
    ]

    const passwordRules = [
      v => !!v || 'Password is required',
      v => v.length >= 6 || 'Password must be at least 6 characters'
    ]

    // Toggle between signin and signup
    const toggleAuthMode = () => {
      authMode.value = authMode.value === 'signin' ? 'signup' : 'signin'
    }

    // Submit form based on current auth mode
    const submitForm = async () => {
      if (!form.value.validate()) return

      const auth = getAuth()
      error.value = null
      isLoading.value = true

      try {
        if (authMode.value === 'signin') {
          await signInWithEmailAndPassword(auth, email.value, password.value)
        } else {
          await createUserWithEmailAndPassword(auth, email.value, password.value)
        }

        // Redirect after successful authentication
        const redirectPath = route.query.redirect || '/dashboard'
        router.push(redirectPath)
      } catch (err) {
        error.value = err.message
        console.error('Authentication error:', err)
      } finally {
        isLoading.value = false
      }
    }

    // Sign in with Google
    const signInWithGoogle = async () => {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()
      error.value = null
      isLoadingGoogle.value = true

      try {
        await signInWithPopup(auth, provider)

        // Redirect after successful authentication
        const redirectPath = route.query.redirect || '/dashboard'
        router.push(redirectPath)
      } catch (err) {
        error.value = err.message
        console.error('Google auth error:', err)
      } finally {
        isLoadingGoogle.value = false
      }
    }

    // Sign in anonymously
    const signInAnonymously = async () => {
      error.value = null
      isLoadingAnonymous.value = true

      try {
        await firebaseSignInAnonymously(auth)

        // Redirect after successful authentication
        const redirectPath = route.query.redirect || '/dashboard'
        await router.push(redirectPath)
      } catch (err) {
        error.value = err.message || 'An error occurred during anonymous sign-in'
        console.error('Anonymous auth error:', err)
      } finally {
        isLoadingAnonymous.value = false
      }
    }

    // Check if already authenticated
    onMounted(() => {
      const auth = getAuth()
      if (auth.currentUser) {
        const redirectPath = route.query.redirect || '/dashboard'
        router.push(redirectPath)
      }
    })

    return {
      form,
      authMethod,
      authMode,
      email,
      password,
      showPassword,
      isFormValid,
      isLoading,
      isLoadingGoogle,
      isLoadingAnonymous,
      error,
      emailRules,
      passwordRules,
      toggleAuthMode,
      submitForm,
      signInWithGoogle,
      signInAnonymously
    }
  }
}
</script>

<style scoped>
.login {
  padding-bottom: 60px;
}
</style>
