import operator
from segservice import app

### THIS IS AN EXAMPLE ###
# Uncomment the decorator line "@app.method(..." on the definition of
# ``calculate`` below to activate this calculator.

class Calculator:
    OPERATION_MAP = {
        '+': operator.add,
        '-': operator.sub,
        '*': operator.mul,
        '/': operator.truediv,
    }
    
    def __init__(self, ):
        self.stack = []
        self.operation = None
    
    @classmethod
    def from_request_data(cls, jd):
        instance = cls()
        instance.stack = jd['stack']
        instance.operation = jd['operation']
        return instance
    
    def to_response_data(self, ):
        return dict(
            stack=self.stack,
            operation=self.operation,
        )
    
    def execute(self, ):
        stack, op = self.stack, self.operation
        if op not in self.OPERATION_MAP:
            stack.append("unknown operation {!r}".format(op))
        elif len(stack) < 2:
            stack.append("stack underflow executing {!r}".format(op))
        else:
            try:
                stack[-2:] = [self.OPERATION_MAP[op](*stack[-2:])]
            except Exception as e:
                stack.append("error executing {!r}: {}".format(op, e))
        self.operation = None

# @app.method("/calculate", non_qs_params=['stack'])
def calculate(c: Calculator):
    c.execute()
    return c
