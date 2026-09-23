import sqlite3
import json
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "digital_twin.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Zones Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        structure_type TEXT NOT NULL,
        description TEXT,
        critical_sensor TEXT,
        max_allowable_strain REAL,
        max_allowable_vibration REAL,
        max_allowable_tilt REAL,
        max_allowable_crack REAL,
        max_allowable_corrosion REAL,
        max_allowable_water REAL
    )
    """)

    # Sensor Telemetry Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        strain REAL,
        vibration REAL,
        tilt REAL,
        crack_width REAL,
        temperature REAL,
        humidity REAL,
        corrosion_rate REAL,
        water_level REAL,
        sensor_status TEXT DEFAULT 'ONLINE',
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    )
    """)

    # AI Inferences Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_inferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        anomaly_flag INTEGER NOT NULL,
        anomaly_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        rul_hours REAL NOT NULL,
        fatigue_index REAL NOT NULL,
        feature_attributions TEXT NOT NULL,
        diagnosis_summary TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    )
    """)

    # Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
    )
    """)

    # Material Passport Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS material_passport (
        zone_id TEXT PRIMARY KEY,
        component_name TEXT NOT NULL,
        material_type TEXT NOT NULL,
        standard_grade TEXT NOT NULL,
        yield_strength_mpa REAL,
        elastic_modulus_gpa REAL,
        design_strain_limit_ue REAL,
        design_crack_limit_mm REAL,
        design_vibration_limit_g REAL,
        design_corrosion_limit_um REAL,
        installation_date TEXT,
        carbon_footprint_kg REAL,
        design_fatigue_cycles INTEGER,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
    )
    """)

    # Populate default zones if empty
    cursor.execute("SELECT COUNT(*) as count FROM zones")
    if cursor.fetchone()["count"] == 0:
        zones_data = [
            ("zone-1", "South Pier Foundation & Caisson", "Pier Foundation", "Submerged concrete pile cap and bedrock mooring anchoring the south span.", "tilt", 450.0, 0.25, 0.60, 0.40, 25.0, 4.0),
            ("zone-2", "Main Roadway Deck Mid-Span", "Deck Girder", "Steel-composite orthotropic deck at the maximum dynamic deflection midpoint.", "strain", 750.0, 0.35, 0.40, 1.20, 15.0, 2.0),
            ("zone-3", "North Pylon & Tower Saddle", "Vertical Pylon", "Post-tensioned high-strength concrete pylon bearing primary dead and live cable loads.", "vibration", 500.0, 0.40, 0.80, 0.50, 10.0, 2.0),
            ("zone-4", "Cable-Stay Harness Stay-04", "Tension Stay Cable", "High-tensile parallel strand stay cables under constant tension and harmonic wind loads.", "strain", 900.0, 0.30, 0.30, 0.10, 8.0, 1.0),
            ("zone-5", "North Abutment & Expansion Joint", "Abutment Joint", "Modular elastomeric expansion joint accommodating thermal expansion and seismic movements.", "crack_width", 400.0, 0.20, 0.50, 2.00, 20.0, 3.0)
        ]
        cursor.executemany("""
        INSERT INTO zones (id, name, structure_type, description, critical_sensor, max_allowable_strain, max_allowable_vibration, max_allowable_tilt, max_allowable_crack, max_allowable_corrosion, max_allowable_water)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, zones_data)

        passport_data = [
            ("zone-1", "South Pier Foundation", "High-Density Reinforced Concrete", "C50/60 Marine Spec", 55.0, 37.0, 450.0, 0.40, 0.25, 25.0, "2019-04-12", 42000.0, 50000000),
            ("zone-2", "Mid-Span Deck Girder", "Structural Weathering Steel", "ASTM A588 Grade 50W", 345.0, 205.0, 750.0, 1.20, 0.35, 15.0, "2020-08-19", 68500.0, 25000000),
            ("zone-3", "North Pylon Structure", "Ultra-High Performance Concrete", "UHPC Ductal Grade 150", 150.0, 50.0, 500.0, 0.50, 0.40, 10.0, "2019-09-05", 89000.0, 60000000),
            ("zone-4", "Stay Cable System 04", "Galvanized High-Tensile Steel Wire", "ASTM A416 Grade 270", 1860.0, 195.0, 900.0, 0.10, 0.30, 8.0, "2021-02-14", 19500.0, 40000000),
            ("zone-5", "North Expansion Joint", "Cast Steel & Chloroprene Elastomer", "AASHTO M270 Grade 36", 250.0, 200.0, 400.0, 2.00, 0.20, 20.0, "2021-06-28", 12400.0, 15000000)
        ]
        cursor.executemany("""
        INSERT INTO material_passport (zone_id, component_name, material_type, standard_grade, yield_strength_mpa, elastic_modulus_gpa, design_strain_limit_ue, design_crack_limit_mm, design_vibration_limit_g, design_corrosion_limit_um, installation_date, carbon_footprint_kg, design_fatigue_cycles)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, passport_data)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database schema initialized.")
