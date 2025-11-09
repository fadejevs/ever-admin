from flask import Blueprint, jsonify, request, current_app
import logging
from datetime import datetime, timedelta
import random

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a Blueprint
finances_bp = Blueprint('finances', __name__)

@finances_bp.route('/expenses', methods=['GET'])
def get_expenses():
    """Get expenses data for the admin dashboard"""
    try:
        # Get query parameters
        period = request.args.get('period', '30d')
        
        # Calculate date range based on period
        end_date = datetime.now()
        if period == '7d':
            start_date = end_date - timedelta(days=7)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        else:  # 30d default
            start_date = end_date - timedelta(days=30)
        
        # Sample expenses data based on 14 free users (beta phase)
        expenses_data = {
            'total': 850.00,  # Lower expenses for beta with 14 users
            'breakdown': {
                'infrastructure': 450.00,  # Cloud hosting, databases, etc.
                'development': 250.00,     # Development tools, APIs
                'marketing': 150.00        # Minimal marketing for beta
            },
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'currency': 'USD'
        }
        
        return jsonify(expenses_data), 200
        
    except Exception as e:
        logger.error(f"Error getting expenses: {e}")
        return jsonify({'error': 'Failed to fetch expenses data'}), 500

@finances_bp.route('/user-payments', methods=['GET'])
def get_user_payments():
    """Get user payments and subscription data"""
    try:
        # Get query parameters
        period = request.args.get('period', '30d')
        
        # Calculate date range based on period
        end_date = datetime.now()
        if period == '7d':
            start_date = end_date - timedelta(days=7)
        elif period == '90d':
            start_date = end_date - timedelta(days=90)
        else:  # 30d default
            start_date = end_date - timedelta(days=30)
        
        # Sample user payments data based on 14 free users (beta phase)
        user_payments_data = {
            'total_users': 14,              # Total registered users
            'paid_users': 0,                # Currently 0 since all users are free
            'free_users': 14,               # All 14 users are free for now
            'total_revenue': 0.00,          # No revenue yet
            'monthly_revenue': 0.00,        # No monthly revenue yet
            'growth_rate': 25.0,            # High growth rate for beta (small base)
            'churn_rate': 0.0,              # No churn since free and small user base
            'plans': [
                {
                    'name': 'Free',
                    'users': 14,
                    'conversion': 0,        # No conversion since it's the only plan
                    'revenue': 0.00
                },
                {
                    'name': 'Pro',
                    'users': 0,
                    'conversion': 0,
                    'revenue': 0.00
                },
                {
                    'name': 'Enterprise',
                    'users': 0,
                    'conversion': 0,
                    'revenue': 0.00
                }
            ],
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'currency': 'USD'
        }
        
        return jsonify(user_payments_data), 200
        
    except Exception as e:
        logger.error(f"Error getting user payments: {e}")
        return jsonify({'error': 'Failed to fetch user payments data'}), 500

@finances_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Get system metrics data"""
    try:
        # Sample metrics data for beta with 14 users
        metrics_data = {
            'services': [
                {
                    'name': 'Translation API',
                    'subtitle': 'Core translation service',
                    'status': 'healthy',
                    'error_rate': 0.2,
                    'latency': 95,
                    'calls': 1240,
                    'highlight': False
                },
                {
                    'name': 'Speech Recognition',
                    'subtitle': 'Audio processing service',
                    'status': 'healthy',
                    'error_rate': 0.8,
                    'latency': 720,
                    'calls': 890,
                    'highlight': False
                },
                {
                    'name': 'Text-to-Speech',
                    'subtitle': 'Audio synthesis service',
                    'status': 'healthy',
                    'error_rate': 0.3,
                    'latency': 280,
                    'calls': 450,
                    'highlight': False
                },
                {
                    'name': 'User Management',
                    'subtitle': 'Authentication & profiles',
                    'status': 'healthy',
                    'error_rate': 0.1,
                    'latency': 35,
                    'calls': 2100,
                    'highlight': False
                }
            ],
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify(metrics_data), 200
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return jsonify({'error': 'Failed to fetch metrics data'}), 500

@finances_bp.route('/benchmarks', methods=['GET'])
def get_benchmarks():
    """Get ASR benchmarks data"""
    try:
        # Sample benchmarks data
        benchmarks_data = [
            {
                'model_name': 'Whisper Large v3',
                'language': 'overall',
                'avg_overall_wer': 2.8,
                'avg_rtf_total': 0.15,
                'cost_batch_per_1000_min': 0.45,
                'is_best': True
            },
            {
                'model_name': 'Whisper Medium',
                'language': 'overall',
                'avg_overall_wer': 3.2,
                'avg_rtf_total': 0.08,
                'cost_batch_per_1000_min': 0.25,
                'is_best': False
            },
            {
                'model_name': 'Whisper Small',
                'language': 'overall',
                'avg_overall_wer': 4.1,
                'avg_rtf_total': 0.05,
                'cost_batch_per_1000_min': 0.15,
                'is_best': False
            },
            {
                'model_name': 'Whisper Large v3',
                'language': 'en',
                'avg_overall_wer': 2.1,
                'avg_rtf_total': 0.12,
                'cost_batch_per_1000_min': 0.42,
                'is_best': True
            },
            {
                'model_name': 'Whisper Medium',
                'language': 'en',
                'avg_overall_wer': 2.8,
                'avg_rtf_total': 0.07,
                'cost_batch_per_1000_min': 0.22,
                'is_best': False
            }
        ]
        
        return jsonify(benchmarks_data), 200
        
    except Exception as e:
        logger.error(f"Error getting benchmarks: {e}")
        return jsonify({'error': 'Failed to fetch benchmarks data'}), 500

@finances_bp.route('/metrics/event-quality', methods=['GET'])
def get_event_quality_assessments():
    """Get event quality assessments"""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        since = request.args.get('since')  # ISO timestamp
        
        # TODO: Replace with actual database query
        # For now, return sample data matching the expected structure
        # In production, this should query the metrics/ingest endpoint data
        # where type='event_quality'
        
        sample_assessments = [
            {
                'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
                'assessment': {
                    'eventId': 'evt_' + ''.join(random.choices('0123456789abcdef', k=12)),
                    'eventTitle': 'International Conference Day 1',
                    'durationMinutes': 45.5,
                    'metrics': {
                        'totalChunks': 120,
                        'totalTranslations': 115,
                        'avgProcessingTime': 245,
                        'avgTranslationTime': 180,
                        'safetyBlocks': 2,
                        'emptyDrops': 3,
                        'connectionErrors': 1,
                        'reconnects': 0
                    },
                    'scores': {
                        'translationLatency': 85,
                        'systemReliability': 95,
                        'contentSafety': 100
                    },
                    'overallScore': 93
                }
            },
            {
                'timestamp': (datetime.now() - timedelta(hours=5)).isoformat(),
                'assessment': {
                    'eventId': 'evt_' + ''.join(random.choices('0123456789abcdef', k=12)),
                    'eventTitle': 'Team Meeting - Q4 Planning',
                    'durationMinutes': 30.0,
                    'metrics': {
                        'totalChunks': 85,
                        'totalTranslations': 82,
                        'avgProcessingTime': 320,
                        'avgTranslationTime': 250,
                        'safetyBlocks': 0,
                        'emptyDrops': 1,
                        'connectionErrors': 0,
                        'reconnects': 1
                    },
                    'scores': {
                        'translationLatency': 72,
                        'systemReliability': 88,
                        'contentSafety': 100
                    },
                    'overallScore': 87
                }
            },
            {
                'timestamp': (datetime.now() - timedelta(days=1)).isoformat(),
                'assessment': {
                    'eventId': 'evt_' + ''.join(random.choices('0123456789abcdef', k=12)),
                    'eventTitle': 'Product Launch Webinar',
                    'durationMinutes': 60.0,
                    'metrics': {
                        'totalChunks': 200,
                        'totalTranslations': 195,
                        'avgProcessingTime': 210,
                        'avgTranslationTime': 165,
                        'safetyBlocks': 1,
                        'emptyDrops': 2,
                        'connectionErrors': 0,
                        'reconnects': 0
                    },
                    'scores': {
                        'translationLatency': 90,
                        'systemReliability': 98,
                        'contentSafety': 100
                    },
                    'overallScore': 96
                }
            }
        ]
        
        # Filter by 'since' if provided
        if since:
            since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
            sample_assessments = [
                a for a in sample_assessments 
                if datetime.fromisoformat(a['timestamp'].replace('Z', '+00:00')) >= since_dt
            ]
        
        # Limit results
        sample_assessments = sample_assessments[:limit]
        
        response_data = {
            'count': len(sample_assessments),
            'assessments': sample_assessments
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"Error getting event quality assessments: {e}")
        return jsonify({'error': 'Failed to fetch event quality assessments'}), 500
