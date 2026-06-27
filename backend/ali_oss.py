import os
import logging
from dotenv import load_dotenv

load_dotenv()
load_dotenv("backend/.env")

logger = logging.getLogger("ali_oss")

# Initialize oss2 if available
try:
    import oss2
    OSS_AVAILABLE = True
except ImportError:
    OSS_AVAILABLE = False
    logger.warning("oss2 package is not installed. Alibaba Cloud OSS will run in Simulated Sandbox Mode.")

def upload_itinerary_to_oss(guest_id: str, content: str) -> str:
    """
    Uploads a generated trip itinerary to an Alibaba Cloud OSS bucket.
    If credentials are not configured, falls back to a sandbox simulated public OSS link.
    
    Returns:
        str: The URL of the uploaded itinerary file (live or simulated).
    """
    access_key_id = os.getenv("ALI_OSS_ACCESS_KEY_ID")
    access_key_secret = os.getenv("ALI_OSS_ACCESS_KEY_SECRET")
    endpoint = os.getenv("ALI_OSS_ENDPOINT", "oss-ap-southeast-1.aliyuncs.com") # Singapore (International) regional default
    bucket_name = os.getenv("ALI_OSS_BUCKET", "islandflow-qwen-bucket")
    
    object_key = f"itineraries/{guest_id}_itinerary.md"
    
    # Check if we should run in live mode
    if OSS_AVAILABLE and access_key_id and access_key_secret and bucket_name:
        logger.info(f"Uploading itinerary for guest '{guest_id}' to live Alibaba Cloud OSS bucket '{bucket_name}'...")
        try:
            # Authenticate with credentials
            auth = oss2.Auth(access_key_id, access_key_secret)
            # Standard regional endpoint bucket interface
            bucket = oss2.Bucket(auth, f"https://{endpoint}", bucket_name)
            
            # Put the content as binary/bytes
            bucket.put_object(object_key, content.encode('utf-8'))
            
            # Generate a signed URL valid for 24 hours (86400 seconds) for guest downloads
            signed_url = bucket.sign_url('GET', object_key, 86400)
            logger.info(f"Successfully uploaded to live OSS. Signed URL: {signed_url}")
            return signed_url
            
        except Exception as e:
            logger.error(f"Failed uploading to live Alibaba Cloud OSS: {e}. Falling back to sandbox simulation.")
            # Fall back to simulation on error
    else:
        logger.warning(
            "Alibaba Cloud OSS credentials are not fully configured in your .env, or oss2 is not loaded. "
            "Running in high-fidelity Sandbox Simulation Mode."
        )
        
    # Simulated Sandbox Fallback
    simulated_url = f"https://{bucket_name}.{endpoint}/{object_key}?security_token=sandbox_simulation_mode_active_pass_2026"
    logger.info(f"Generated Simulated Alibaba Cloud OSS URL: {simulated_url}")
    return simulated_url
