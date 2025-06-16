<template>
  <div v-if="showStatus" class="config-status">
    <v-alert
      :type="statusType"
      :icon="statusIcon"
      :title="title"
      variant="tonal"
      class="mb-4"
    >
      <div v-if="issues.length > 0">
        <p>The following configuration issues were detected:</p>
        <ul>
          <li v-for="(issue, index) in issues" :key="index">
            {{ issue }}
          </li>
        </ul>
      </div>

      <v-divider v-if="showCapabilities" class="my-4" />

      <div v-if="showCapabilities" class="capability-list">
        <p>Available features:</p>
        <div class="d-flex flex-wrap">
          <v-chip
            v-for="(available, feature) in capabilities"
            :key="feature"
            class="ma-1"
            :color="available ? 'success' : 'error'"
            size="small"
          >
            {{ formatFeatureName(feature) }}: {{ available ? '✓' : '✗' }}
          </v-chip>
        </div>
      </div>

      <template v-if="isProduction && !isValid" #append>
        <v-btn
          color="primary"
          size="small"
          @click="dismissForSession"
        >
          Dismiss
        </v-btn>
      </template>
    </v-alert>
  </div>
</template>

<script>
export default {
  name: 'ConfigurationStatus',
  props: {
    displayMode: {
      type: String,
      default: 'auto', // 'auto', 'always', 'never', 'errors-only'
      validator: (value) => ['auto', 'always', 'never', 'errors-only'].includes(value)
    },
    showCapabilities: {
      type: Boolean,
      default: true
    }
  },
  emits: ['dismissed'],
  data() {
    return {
      dismissed: false,
      sessionDismissKey: 'config_status_dismissed'
    }
  },
  computed: {
    isValid() {
      return this.$configStatus?.isValid ?? true
    },
    isProduction() {
      return this.$config?.env?.isProduction ?? false
    },
    isDevelopment() {
      return this.$config?.env?.isDevelopment ?? false
    },
    configSkipped() {
      return this.$configStatus?.skipped ?? false
    },
    issues() {
      return this.$configStatus?.issues ?? []
    },
    capabilities() {
      return this.$configStatus?.capabilities ?? {}
    },
    showStatus() {
      if (this.displayMode === 'never' || this.dismissed) {
        return false
      }
      if (this.displayMode === 'always') {
        return true
      }
      if (this.displayMode === 'errors-only') {
        return !this.isValid
      }
      // Auto mode - show in development or if there are issues
      return this.isDevelopment || !this.isValid
    },
    statusType() {
      if (this.configSkipped) return 'info'
      return this.isValid ? 'success' : 'warning'
    },
    statusIcon() {
      if (this.configSkipped) return 'mdi-information'
      return this.isValid ? 'mdi-check-circle' : 'mdi-alert'
    },
    title() {
      if (this.configSkipped) return 'Configuration Validation Skipped'
      return this.isValid
        ? 'Application Configuration Valid'
        : 'Configuration Issues Detected'
    }
  },
  created() {
    // Check for session dismissal
    if (sessionStorage.getItem(this.sessionDismissKey) === 'true') {
      this.dismissed = true
    }
  },
  methods: {
    dismissForSession() {
      this.dismissed = true
      sessionStorage.setItem(this.sessionDismissKey, 'true')
      this.$emit('dismissed')
    },
    formatFeatureName(name) {
      return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
    }
  }
}
</script>

<style scoped>
.config-status {
  max-width: 800px;
  margin: 0 auto;
}
.capability-list {
  font-size: 0.9rem;
}
</style>
