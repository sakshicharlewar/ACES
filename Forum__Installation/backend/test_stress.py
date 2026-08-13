import asyncio
import aiohttp
import time
import statistics

BASE_URL = "http://127.0.0.1:8000"
NUM_USERS = 1000
CONCURRENCY = 100  # Number of concurrent requests

async def fetch_endpoint(session, url, method="GET", payload=None):
    try:
        start_time = time.time()
        if method == "GET":
            async with session.get(url) as response:
                await response.read()
                return time.time() - start_time, response.status
        else:
            async with session.post(url, json=payload) as response:
                await response.read()
                return time.time() - start_time, response.status
    except Exception as e:
        return 0, 500

async def simulate_user(session, semaphore, stats):
    async with semaphore:
        # Simulate browsing multiple pages
        endpoints = [
            "/api/events",
            "/api/notices",
            "/api/committee",
            "/api/faculty",
            "/api/hod",
            "/api/laboratories"
        ]
        for ep in endpoints:
            latency, status = await fetch_endpoint(session, f"{BASE_URL}{ep}")
            stats['total'] += 1
            if status == 200:
                stats['success'] += 1
                stats['latencies'].append(latency)
            elif status == 429:
                stats['rate_limited'] += 1
            else:
                stats['failed'] += 1

async def run_stress_test():
    print(f"Starting stress test with {NUM_USERS} users (Concurrency: {CONCURRENCY})...")
    
    semaphore = asyncio.Semaphore(CONCURRENCY)
    stats = {
        'total': 0,
        'success': 0,
        'failed': 0,
        'rate_limited': 0,
        'latencies': []
    }
    
    # We use a custom connector with a larger pool limit
    connector = aiohttp.TCPConnector(limit=CONCURRENCY)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [simulate_user(session, semaphore, stats) for _ in range(NUM_USERS)]
        start_time = time.time()
        await asyncio.gather(*tasks)
        total_time = time.time() - start_time
        
    print("\n--- Stress Test Results ---")
    print(f"Total Time: {total_time:.2f} seconds")
    print(f"Total Requests: {stats['total']}")
    print(f"Successful: {stats['success']}")
    print(f"Failed (500s/Others): {stats['failed']}")
    print(f"Rate Limited (429s): {stats['rate_limited']}")
    
    if stats['latencies']:
        avg_latency = statistics.mean(stats['latencies']) * 1000
        p95_latency = statistics.quantiles(stats['latencies'], n=20)[18] * 1000
        print(f"Average Latency: {avg_latency:.2f} ms")
        print(f"P95 Latency: {p95_latency:.2f} ms")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
