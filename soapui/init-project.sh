#!/bin/sh
set -eu

project=/config/Calculadora-SOAP-soapui-project.xml

if [ ! -e "$project" ]; then
    install -o abc -g abc -m 644 /defaults/soapui/Calculadora-SOAP-soapui-project.xml "$project"
    echo "[soapui-init] Projeto Calculadora SOAP copiado para $project"
fi
