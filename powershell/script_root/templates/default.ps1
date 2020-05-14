Import-Module "@@DODO_LIB_PATH";
. '@@scriptFullPath';

if ((Test-Path '@@scriptFullPath') -ne $true) { throw "Failed to load @@scriptFullPath" }

$DODO_LOG_FILE = "@@DODO_LOG_FILE";
$LOG_PREFIX = "[$DODO_SCRIPT_NAME (v $DODO_SCRIPT_VERSION)]"
Write-Output "$LOG_PREFIX Start" | % {
	Write-Host $_;
	Out-File -FilePath $DODO_LOG_FILE -Append -InputObject $_ 
};

Update-EnvironmentData;

if ("$(isDodoExecutionContextCorrect)" -eq "$false") {
    Write-Output "$LOG_PREFIX Conditions are not met, so, we will exit now." | % { Write-Host $_; Out-File -FilePath $DODO_LOG_FILE -Append -InputObject $_ };
    return
};
if ($(isAlreadyExecuted) -ne $true){
    $executionResult = (Main);
    Write-Output "$LOG_PREFIX Execution Result: $executionResult" | % { Write-Host $_; Out-File -FilePath $DODO_LOG_FILE -Append -InputObject $_ };
    if ($executionResult -ne $true) { $executionResult = $false }
    Write-Output "$LOG_PREFIX Execution Result: $executionResult" | % { Write-Host $_; Out-File -FilePath $DODO_LOG_FILE -Append -InputObject $_ };
    Save-ExecutionStatus $executionResult
};