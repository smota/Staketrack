import { auth } from '../../../firebase/firebaseConfig.js';

// OpenTelemetry imports
import { 
  trace, 
  context, 
  propagation, 
  SpanStatusCode 
} from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api-metrics';
import { logs } from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { ConsoleLogRecorder, LoggerProvider } from '@opentelemetry/sdk-logs';

// Log levels
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

class TelemetryService {
  constructor() {
    this.tracer = null;
    this.meter = null;
    this.logger = null;
    
    // Metrics
    this.pageLoadMetric = null;
    this.userActionsCounter = null;
    this.stakeholdersCounter = null;
    this.operationDurationHistogram = null;
  }
  
  /**
   * Initialize OpenTelemetry
   */
  init() {
    console.log('Initializing OpenTelemetry...');
    
    // Create a resource that identifies your application
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'staketrack-app',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production'
    });
    
    // Configure tracing
    this._initTracing(resource);
    
    // Configure metrics
    this._initMetrics(resource);
    
    // Configure logging
    this._initLogging(resource);
    
    console.log('OpenTelemetry initialized successfully');
  }
  
  /**
   * Initialize tracing
   * @param {Resource} resource - OpenTelemetry resource
   * @private
   */
  _initTracing(resource) {
    // Create a tracer provider
    const tracerProvider = new WebTracerProvider({ resource });
    
    // Add span processors
    tracerProvider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    );
    
    // Use OTLP exporter for production
    const traceExporter = new OTLPTraceExporter({
      url: 'https://your-collector-endpoint/v1/traces', // Replace with your endpoint
    });
    
    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(traceExporter)
    );
    
    // Register the tracer provider
    tracerProvider.register({
      contextManager: new ZoneContextManager()
    });
    
    // Register auto-instrumentations
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [/.*/], // Propagate headers to all URLs
        }),
      ],
    });
    
    // Get a tracer
    this.tracer = trace.getTracer('staketrack-tracer');
  }
  
  /**
   * Initialize metrics
   * @param {Resource} resource - OpenTelemetry resource
   * @private
   */
  _initMetrics(resource) {
    // Create metrics exporter
    const metricExporter = new OTLPMetricExporter({
      url: 'https://your-collector-endpoint/v1/metrics', // Replace with your endpoint
    });
    
    // Create meter provider
    const meterProvider = new MeterProvider({
      resource: resource,
    });
    
    // Add exporter to meter provider
    meterProvider.addMetricReader(metricExporter);
    
    // Register the meter provider
    metrics.setGlobalMeterProvider(meterProvider);
    
    // Create a meter
    this.meter = metrics.getMeter('staketrack-metrics');
    
    // Create metrics
    this.pageLoadMetric = this.meter.createHistogram('page_load_time', {
      description: 'Time taken to load pages',
      unit: 'ms',
    });
    
    this.userActionsCounter = this.meter.createCounter('user_actions', {
      description: 'Count of user actions',
    });
    
    this.stakeholdersCounter = this.meter.createUpDownCounter('stakeholders_count', {
      description: 'Number of stakeholders in a map',
    });
    
    this.operationDurationHistogram = this.meter.createHistogram('operation_duration', {
      description: 'Duration of operations',
      unit: 'ms',
    });
  }
  
  /**
   * Initialize logging
   * @param {Resource} resource - OpenTelemetry resource
   * @private
   */
  _initLogging(resource) {
    // Create logger provider
    const loggerProvider = new LoggerProvider({
      resource: resource,
    });
    
    // Add a console recorder
    loggerProvider.addLogRecorder(new ConsoleLogRecorder());
    
    // Register the logger provider
    logs.setGlobalLoggerProvider(loggerProvider);
    
    // Get a logger
    this.logger = logs.getLogger('staketrack-logger');
  }
  
  /**
   * Create a new span
   * @param {string} name - Span name
   * @param {Function} fn - Function to execute within the span
   * @param {Object} attributes - Span attributes
   * @returns {Promise<any>} - Result of the function
   */
  async createSpan(name, fn, attributes = {}) {
    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        // Add user context if authenticated
        if (auth.currentUser) {
          span.setAttributes({
            'user.id': auth.currentUser.uid,
            'user.email': auth.currentUser.email,
          });
        }
        
        // Add custom attributes
        span.setAttributes(attributes);
        
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
  
  /**
   * Record a metric value
   * @param {string} metricName - Name of the metric to record
   * @param {number} value - Value to record
   * @param {Object} attributes - Metric attributes
   */
  recordMetric(metricName, value, attributes = {}) {
    switch (metricName) {
      case 'page_load_time':
        this.pageLoadMetric.record(value, attributes);
        break;
      case 'user_actions':
        this.userActionsCounter.add(value, attributes);
        break;
      case 'stakeholders_count':
        this.stakeholdersCounter.add(value, attributes);
        break;
      case 'operation_duration':
        this.operationDurationHistogram.record(value, attributes);
        break;
      default:
        console.warn(`Unknown metric: ${metricName}`);
    }
  }
  
  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} attributes - Log attributes
   */
  log(level, message, attributes = {}) {
    // Add user context if authenticated
    const logAttributes = { ...attributes };
    if (auth.currentUser) {
      logAttributes.userId = auth.currentUser.uid;
      logAttributes.userEmail = auth.currentUser.email;
    }
    
    this.logger.emit({
      severityText: level,
      body: message,
      attributes: logAttributes,
    });
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} attributes - Log attributes
   */
  debug(message, attributes = {}) {
    this.log(LogLevel.DEBUG, message, attributes);
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} attributes - Log attributes
   */
  info(message, attributes = {}) {
    this.log(LogLevel.INFO, message, attributes);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} attributes - Log attributes
   */
  warn(message, attributes = {}) {
    this.log(LogLevel.WARN, message, attributes);
  }
  
  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Error} error - Error object
   * @param {Object} attributes - Log attributes
   */
  error(message, error, attributes = {}) {
    const errorAttributes = {
      ...attributes,
      'error.message': error.message,
      'error.stack': error.stack,
    };
    this.log(LogLevel.ERROR, message, errorAttributes);
  }
  
  /**
   * Log a fatal message
   * @param {string} message - Log message
   * @param {Error} error - Error object
   * @param {Object} attributes - Log attributes
   */
  fatal(message, error, attributes = {}) {
    const errorAttributes = {
      ...attributes,
      'error.message': error.message,
      'error.stack': error.stack,
    };
    this.log(LogLevel.FATAL, message, errorAttributes);
  }
}

export default new TelemetryService(); 