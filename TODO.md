User is not inserted into DB ofter sign-in


I'm implementing a system of recood for a nutritionist drs. I've put together a tech demostrator which is available on this repo. That's the core stack. It can be changed if needed. 


Reqs:

This is a system of record for a nutritionst. 

Personas
    Patient
    Doctor
    Mgrs

Main features
    Appointments
        Patients schedule appointments with drs
            Ocationally, an appointment involves more than one patinet
        Drs see their shedule
        Drs take notes, measurements and metrics during appointments, and those are attached to the patients profile
        Drs and managers can schedule appointments. While scheduling appointments, both dr's agenda and patient historic should be available. There are two sort of notes - internal (only for the doctor) and public (both and patient) 
        Patients only see their appointments
        Drs usually generate assets during appointments (PDFs). These are attached to the patient's profile


    
    Patient profile

        A patient's profile is the record of the patient's evolution over time. It contains patient attributes (name, date of birth, nutrition plan)

        The patient profile includes a number of metrics. Metrics are a snapshot in time of a given dimension. Some metrics can me meassured only by drs. Others (e.g. weight) can be also meassured by patients. Measurements taken by patients should be distnguished from those taken by doctors

        A patient's profile is visible only to himself, drs and managers.

        A patient profile includes modern visualization of metrics over time


        