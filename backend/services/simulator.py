import time
import math
import random
from datetime import datetime, timezone

class SensorSimulator:
    def __init__(self):
        self.scenario = "NORMAL"
        self.step_count = 0
        self.zones = ["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"]
        
        # Base state per zone
        self.state = {
            "zone-1": {"strain": 140.0, "vibration": 0.025, "tilt": 0.04, "crack_width": 0.05, "temperature": 21.5, "humidity": 58.0, "corrosion_rate": 3.2, "water_level": 1.4},
            "zone-2": {"strain": 184.0, "vibration": 0.038, "tilt": 0.05, "crack_width": 0.12, "temperature": 23.0, "humidity": 52.0, "corrosion_rate": 2.1, "water_level": 1.4},
            "zone-3": {"strain": 190.0, "vibration": 0.035, "tilt": 0.05, "crack_width": 0.08, "temperature": 22.2, "humidity": 54.0, "corrosion_rate": 1.5, "water_level": 1.4},
            "zone-4": {"strain": 280.0, "vibration": 0.042, "tilt": 0.03, "crack_width": 0.02, "temperature": 24.1, "humidity": 50.0, "corrosion_rate": 1.1, "water_level": 1.4},
            "zone-5": {"strain": 160.0, "vibration": 0.028, "tilt": 0.07, "crack_width": 0.18, "temperature": 22.8, "humidity": 56.0, "corrosion_rate": 4.5, "water_level": 1.4},
        }

    def set_scenario(self, scenario_name: str):
        valid = ["NORMAL", "HEAVY_RAIN", "TRAFFIC_OVERLOAD", "GRADUAL_CRACK", "SENSOR_FAILURE"]
        if scenario_name in valid:
            self.scenario = scenario_name
            self.step_count = 0
            return True
        return False

    def generate_tick(self):
        """Generates realistic physics-based telemetry for all 5 zones based on the selected scenario."""
        self.step_count += 1
        timestamp = datetime.now(timezone.utc).isoformat()
        readings = {}

        # Diurnal thermal wave
        t_wave = math.sin(self.step_count * 0.05) * 3.5
        h_wave = math.cos(self.step_count * 0.05) * 5.0

        for zone_id, base in self.state.items():
            noise_strain = random.gauss(0, 4.0)
            noise_vib = abs(random.gauss(0, 0.004))
            noise_tilt = random.gauss(0, 0.003)
            noise_crack = random.gauss(0, 0.002)

            strain = base["strain"] + (t_wave * 2.8) + noise_strain
            vib = base["vibration"] + noise_vib
            tilt = base["tilt"] + noise_tilt
            crack = base["crack_width"] + (t_wave * 0.006) + noise_crack
            temp = base["temperature"] + t_wave + random.gauss(0, 0.2)
            humidity = max(20.0, min(95.0, base["humidity"] + h_wave + random.gauss(0, 0.6)))
            corrosion = base["corrosion_rate"] + random.gauss(0, 0.1)
            water = base["water_level"] + math.sin(self.step_count * 0.08) * 0.15 + random.gauss(0, 0.02)
            sensor_status = "ONLINE"

            # -------------------------------------------------------------
            # SCENARIO 1: NORMAL OPERATION
            # -------------------------------------------------------------
            # Baseline parameters maintained.

            # -------------------------------------------------------------
            # SCENARIO 2: HEAVY RAIN / FLOODING
            # -------------------------------------------------------------
            if self.scenario == "HEAVY_RAIN":
                # High humidity, rising water level, accelerating corrosion risk
                humidity = min(99.0, 94.0 + random.gauss(3.0, 1.0))
                water_surge = min(4.8, 1.5 + (self.step_count * 0.15) + math.sin(self.step_count * 0.3) * 0.2)
                water = water_surge
                if zone_id in ["zone-1", "zone-5"]:
                    corrosion = min(32.0, 6.0 + (self.step_count * 0.8) + random.gauss(0.5, 0.2))
                    vib += 0.08 + abs(random.gauss(0.02, 0.01)) # Hydrodynamic scour vibrations
                    tilt += 0.12 # Hydro-load inclination

            # -------------------------------------------------------------
            # SCENARIO 3: TRAFFIC OVERLOAD (Zone 2 Mid-Span)
            # -------------------------------------------------------------
            elif self.scenario == "TRAFFIC_OVERLOAD" and zone_id == "zone-2":
                # Heavy freight resonance, severe strain spike (>700 ue), high vibration (>0.35g)
                pulse = math.sin(self.step_count * 0.5) * 140.0 + random.gauss(100, 20)
                strain = 680.0 + pulse
                vib = 0.34 + abs(random.gauss(0.06, 0.02))
                tilt += 0.18 + random.gauss(0, 0.03)

            # -------------------------------------------------------------
            # SCENARIO 4: GRADUAL CRACK GROWTH (Zone 5 Expansion Joint)
            # -------------------------------------------------------------
            elif self.scenario == "GRADUAL_CRACK" and zone_id == "zone-5":
                # Fast-forwarded progressive crack opening (0.18mm -> 1.95mm)
                progression = min(2.4, 0.18 + (self.step_count * 0.08) + (self.step_count ** 1.3) * 0.01)
                crack = progression
                strain += progression * 75.0
                vib += 0.14 + abs(random.gauss(0.03, 0.01))

            # -------------------------------------------------------------
            # SCENARIO 5: SENSOR / COMMUNICATION FAILURE (Zone 4 Stay Cable)
            # -------------------------------------------------------------
            elif self.scenario == "SENSOR_FAILURE" and zone_id == "zone-4":
                sensor_status = "DATA_GAP_DISCONNECTED"
                strain = 0.0
                vib = 0.0
                tilt = 0.0
                crack = 0.0
                corrosion = 0.0

            readings[zone_id] = {
                "timestamp": timestamp,
                "zone_id": zone_id,
                "strain": round(float(max(0.0, strain)), 2),
                "vibration": round(float(max(0.0, vib)), 4),
                "tilt": round(float(max(0.0, tilt)), 4),
                "crack_width": round(float(max(0.005, crack)), 3),
                "temperature": round(float(temp), 2),
                "humidity": round(float(humidity), 2),
                "corrosion_rate": round(float(max(0.0, corrosion)), 2),
                "water_level": round(float(max(0.0, water)), 2),
                "sensor_status": sensor_status
            }

        return readings

sensor_simulator = SensorSimulator()
