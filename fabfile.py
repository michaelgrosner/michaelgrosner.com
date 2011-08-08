from fabric.api import local

def clean():
	local("rm -rf deploy")

def init():
	local('bin/hyde create')

def gen():
	clean()
	local('bin/hyde gen') 

def serve():
	gen()
	local('bin/hyde serve')
