<template>
  <div class="not-found">
    <v-container class="text-center">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <v-card class="mt-10 pa-5">
            <v-card-title class="text-h3 mb-5">
              404 - Page Not Found
            </v-card-title>
            
            <v-img
              src="@/assets/not-found.svg"
              alt="Page Not Found"
              max-width="300"
              class="mx-auto mb-5"
            ></v-img>
            
            <v-card-text class="text-body-1">
              <p>Sorry, the page you are looking for doesn't exist or has been moved.</p>
            </v-card-text>
            
            <v-card-actions class="justify-center mt-5">
              <v-btn
                color="primary"
                to="/"
              >
                <v-icon left>mdi-home</v-icon>
                Return to Home
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>

<style scoped>
.not-found {
  min-height: 80vh;
}
</style> 