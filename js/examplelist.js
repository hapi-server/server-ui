function examplelist() {
	// Used to populate Examples drop-down.
	var list = 
	[
		{
			label:"Plot CDAWeb/OMNI_HRO2_1MIN/SYM_H",
		 	value:"#server=CDAWeb&dataset=OMNI_HRO2_1MIN&parameters=SYM_H&start=2003-10-20T00:00:00Z&stop=2003-11-30T00:00:00.000Z&return=image&format=svg"
		 },
		{
			label:"Create Python script to read CDAWeb/OMNI_HRO2_1MIN/SYM_H",
		 	value:"#server=CDAWeb&dataset=OMNI_HRO2_1MIN&parameters=SYM_H&start=2003-10-20T00:00:00Z&stop=2003-11-30T00:00:00.000Z&return=script&format=python"
		 },
		{
			label:"Plot SSCWeb/active/X_TOD",
			value:"#server=SSCWeb&dataset=active&parameters=X_TOD&start=1989-09-29T00:00:00.000Z&stop=1989-09-30T00:00:00.000Z&return=image&format=svg"
		},
		{
			label:"Create MATLAB script to read SSCWeb/active/X_TOD",
			value:"#server=SSCWeb&dataset=active&parameters=X_TOD&start=1989-09-29T00:00:00.000Z&stop=1989-09-30T00:00:00.000Z&return=script&format=matlab"
		}
	]
	return list;
}